import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || '';

router.get('/auth-url', (_req, res) => {
  try {
    if (!FACEBOOK_APP_ID) {
      return res.status(400).json({ error: 'FACEBOOK_APP_ID no configurado en el servidor' });
    }

    const redirectUri = encodeURIComponent(FACEBOOK_REDIRECT_URI);
    const scope = encodeURIComponent('pages_manage_posts,pages_read_engagement,pages_show_list');
    const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

    res.json({ authUrl });
  } catch (err) {
    console.error('[Facebook] Error generating auth URL:', err);
    res.status(500).json({ error: 'Error al generar URL de autenticación' });
  }
});

router.post('/callback', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Código de autorización requerido' });
    }

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      return res.status(400).json({ error: 'Facebook App ID o Secret no configurados' });
    }

    const tokenResponse = await fetch('https://graph.facebook.com/v22.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        redirect_uri: FACEBOOK_REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenResponse.json() as any;

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[Facebook] Token exchange error:', tokenData);
      return res.status(400).json({ error: tokenData.error?.message || 'Error al intercambiar código por token' });
    }

    const userAccessToken = tokenData.access_token;

    const pagesResponse = await fetch(`https://graph.facebook.com/v22.0/me/accounts?access_token=${userAccessToken}`);
    const pagesData = await pagesResponse.json() as any;

    if (!pagesResponse.ok || pagesData.error) {
      console.error('[Facebook] Pages fetch error:', pagesData);
      return res.status(400).json({ error: pagesData.error?.message || 'Error al obtener páginas' });
    }

    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return res.status(400).json({ error: 'No se encontraron páginas de Facebook. Crea una página primero.' });
    }

    const page = pages[0];
    const pageAccessToken = page.access_token;
    const pageId = page.id;
    const pageName = page.name;

    const { error: dbError } = await supabaseAdmin.from('settings').upsert({
      id: 'system',
      facebook_page_id: pageId,
      facebook_page_access_token: pageAccessToken,
      facebook_page_name: pageName,
    });

    if (dbError) {
      console.error('[Facebook] Error saving to settings:', dbError);
      return res.status(500).json({ error: 'Error al guardar configuración de Facebook' });
    }

    res.json({
      success: true,
      pageId,
      pageName,
      message: `Facebook conectado exitosamente a la página: ${pageName}`,
    });
  } catch (err) {
    console.error('[Facebook] Callback error:', err);
    res.status(500).json({ error: 'Error al procesar callback de Facebook' });
  }
});

router.get('/status', requireAuth, async (_req, res) => {
  try {
    const { data } = await supabaseAdmin.from('settings').select('facebook_page_id, facebook_page_name').eq('id', 'system').single();

    if (data?.facebook_page_id) {
      res.json({
        connected: true,
        pageId: data.facebook_page_id,
        pageName: data.facebook_page_name || '',
      });
    } else {
      res.json({ connected: false });
    }
  } catch (err) {
    console.error('[Facebook] Status error:', err);
    res.json({ connected: false });
  }
});

router.post('/post', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'ID del producto requerido' });
    }

    const { data: settings } = await supabaseAdmin.from('settings').select('facebook_page_id, facebook_page_access_token').eq('id', 'system').single();

    if (!settings?.facebook_page_id || !settings?.facebook_page_access_token) {
      return res.status(400).json({ error: 'Facebook no está configurado. Conecta tu cuenta primero.' });
    }

    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', productId).single();
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const priceFormatted = Number(product.price).toLocaleString();
    const shortDescription = product.description
      ? product.description.length > 200
        ? product.description.substring(0, 200) + '...'
        : product.description
      : '';

    const featuresText = product.features && Array.isArray(product.features) && product.features.length > 0
      ? '\n\nCaracterísticas:\n' + product.features.map((f: string) => `• ${f}`).join('\n')
      : '';

    const message = `🔥 ${product.name}\n\n${shortDescription}${featuresText}\n\n💰 Precio: $${priceFormatted} MLC / USD\n📍 Recogida en Bayamo, Granma, Cuba\n🔧 Garantía de rendimiento original\n\n📲 Contáctanos para más información o para reservar.`;

    const formData = new FormData();
    formData.append('message', message);
    if (product.image) {
      formData.append('url', product.image);
      formData.append('access_token', settings.facebook_page_access_token);
      const postResponse = await fetch(
        `https://graph.facebook.com/v22.0/${settings.facebook_page_id}/photos`,
        { method: 'POST', body: formData }
      );
      const postResult = await postResponse.json() as any;

      if (!postResponse.ok) {
        formData.delete('url');
        formData.delete('access_token');
        formData.append('access_token', settings.facebook_page_access_token);
        const textResponse = await fetch(
          `https://graph.facebook.com/v22.0/${settings.facebook_page_id}/feed`,
          { method: 'POST', body: formData }
        );
        const textResult = await textResponse.json() as any;
        if (!textResponse.ok) {
          return res.status(400).json({ error: textResult.error?.message || 'Error al publicar en Facebook' });
        }
        return res.json({ success: true, postId: textResult.id, type: 'text' });
      }

      return res.json({ success: true, postId: postResult.id, type: 'photo' });
    } else {
      formData.append('access_token', settings.facebook_page_access_token);
      const postResponse = await fetch(
        `https://graph.facebook.com/v22.0/${settings.facebook_page_id}/feed`,
        { method: 'POST', body: formData }
      );
      const postResult = await postResponse.json() as any;

      if (!postResponse.ok) {
        return res.status(400).json({ error: postResult.error?.message || 'Error al publicar en Facebook' });
      }

      return res.json({ success: true, postId: postResult.id, type: 'text' });
    }
  } catch (err) {
    console.error('[Facebook] Post error:', err);
    res.status(500).json({ error: 'Error al publicar en Facebook' });
  }
});

export default router;
