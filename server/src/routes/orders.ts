import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

let sseClients: any[] = [];

function broadcastNotification(payload: any) {
  const dataString = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client: any) => {
    try {
      client.write(dataString);
    } catch (err) {
      console.error('[SSE] Failed to write to client', err);
    }
  });
}

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const orders = (data || []).map((o: any) => ({
      id: o.id,
      userEmail: o.user_email,
      userName: o.user_name,
      items: o.items,
      total: o.total,
      paymentMethod: o.payment_method,
      status: o.status,
      createdAt: o.created_at,
      shippingAddress: o.shipping_address,
      phone: o.phone,
    }));
    res.json(orders);
  } catch (err) {
    console.error('[Orders] Error fetching:', err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.post('/', async (req, res) => {
  try {
    const newOrder = req.body;
    if (!newOrder.id) {
      newOrder.id = 'PED-' + Math.floor(1000 + Math.random() * 9000);
    }
    newOrder.createdAt = new Date().toISOString();

    for (const item of newOrder.items) {
      const { data: product } = await supabaseAdmin.from('products').select('stock').eq('id', item.productId).single();
      if (product) {
        const currentStock = product.stock || 0;
        await supabaseAdmin.from('products').update({
          stock: Math.max(0, currentStock - item.quantity),
        }).eq('id', item.productId);
      }
    }

    const { data, error } = await supabaseAdmin.from('orders').upsert({
      id: newOrder.id,
      user_email: newOrder.userEmail,
      user_name: newOrder.userName,
      items: newOrder.items,
      total: newOrder.total,
      payment_method: newOrder.paymentMethod,
      status: newOrder.status || 'pendiente',
      shipping_address: newOrder.shippingAddress,
      phone: newOrder.phone,
      created_at: newOrder.createdAt,
    }).select().single();

    if (error) throw error;

    broadcastNotification({
      type: 'new_order',
      message: `¡Nuevo pedido recibido! ${newOrder.id} por un total de $${newOrder.total.toLocaleString()}`,
      order: {
        id: data.id,
        userEmail: data.user_email,
        userName: data.user_name,
        items: data.items,
        total: data.total,
        paymentMethod: data.payment_method,
        status: data.status,
        createdAt: data.created_at,
        shippingAddress: data.shipping_address,
        phone: data.phone,
      },
    });

    res.status(201).json({
      id: data.id,
      userEmail: data.user_email,
      userName: data.user_name,
      items: data.items,
      total: data.total,
      paymentMethod: data.payment_method,
      status: data.status,
      createdAt: data.created_at,
      shippingAddress: data.shipping_address,
      phone: data.phone,
    });
  } catch (err) {
    console.error('[Orders] Error creating:', err);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabaseAdmin.from('orders').update({ status }).eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Order not found' });
      }
      throw error;
    }
    res.json({
      id: data.id,
      userEmail: data.user_email,
      userName: data.user_name,
      items: data.items,
      total: data.total,
      paymentMethod: data.payment_method,
      status: data.status,
      createdAt: data.created_at,
      shippingAddress: data.shipping_address,
      phone: data.phone,
    });
  } catch (err) {
    console.error('[Orders] Error updating status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.get('/subscribe', requireAuth, requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((client: any) => client !== res);
  });
});

export default router;
