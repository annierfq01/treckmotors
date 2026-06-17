import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('settings').select('*').eq('id', 'system').single();
    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({
          paymentsEnabled: true,
          paymentMethods: [],
          contactPhone: '+53 5212 3456',
          contactEmail: 'cuba@treckmotors.com',
          shopAddress: 'Calle General García #102, e/ Lora y Masó, Bayamo, Granma, Cuba',
          shopHours: 'Lunes a Viernes: 8:30 AM - 5:30 PM | Sábados: 9:00 AM - 1:00 PM',
          reservationsEnabled: true,
          facebookUrl: 'https://facebook.com/treckmotorscuba',
          instagramUrl: 'https://instagram.com/treckmotorscuba',
          whatsappNumber: '+5352123456',
          facebookPageId: '',
          facebookPageAccessToken: '',
          facebookPageName: '',
        });
      }
      throw error;
    }
    res.json({
      paymentsEnabled: data.payments_enabled,
      paymentMethods: data.payment_methods,
      contactPhone: data.contact_phone,
      contactEmail: data.contact_email,
      shopAddress: data.shop_address,
      shopHours: data.shop_hours,
      reservationsEnabled: data.reservations_enabled,
      facebookUrl: data.facebook_url,
      instagramUrl: data.instagram_url,
      whatsappNumber: data.whatsapp_number,
      facebookPageId: data.facebook_page_id || '',
      facebookPageAccessToken: data.facebook_page_access_token || '',
      facebookPageName: data.facebook_page_name || '',
    });
  } catch (err) {
    console.error('[Settings] Error fetching:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const s = req.body;
    const { data, error } = await supabaseAdmin.from('settings').upsert({
      id: 'system',
      payments_enabled: s.paymentsEnabled ?? true,
      payment_methods: s.paymentMethods || [],
      contact_phone: s.contactPhone || '',
      contact_email: s.contactEmail || '',
      shop_address: s.shopAddress || '',
      shop_hours: s.shopHours || '',
      reservations_enabled: s.reservationsEnabled ?? true,
      facebook_url: s.facebookUrl || '',
      instagram_url: s.instagramUrl || '',
      whatsapp_number: s.whatsappNumber || '',
      facebook_page_id: s.facebookPageId || '',
      facebook_page_access_token: s.facebookPageAccessToken || '',
      facebook_page_name: s.facebookPageName || '',
    }).select().single();

    if (error) throw error;
    res.json({
      paymentsEnabled: data.payments_enabled,
      paymentMethods: data.payment_methods,
      contactPhone: data.contact_phone,
      contactEmail: data.contact_email,
      shopAddress: data.shop_address,
      shopHours: data.shop_hours,
      reservationsEnabled: data.reservations_enabled,
      facebookUrl: data.facebook_url,
      instagramUrl: data.instagram_url,
      whatsappNumber: data.whatsapp_number,
      facebookPageId: data.facebook_page_id || '',
      facebookPageAccessToken: data.facebook_page_access_token || '',
      facebookPageName: data.facebook_page_name || '',
    });
  } catch (err) {
    console.error('[Settings] Error updating:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
