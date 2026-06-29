import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('branches').select('*').order('name');
    if (error) throw error;
    const mapped = (data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      schedule: b.schedule || '',
      image: b.image || '',
      isActive: b.is_active,
    }));
    res.json(mapped);
  } catch (err) {
    console.error('[Branches] Error fetching:', err);
    res.status(500).json({ error: 'Failed to load branches' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || `branch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabaseAdmin.from('branches').insert({
      id,
      name: b.name || 'Sucursal',
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      schedule: b.schedule || '',
      image: b.image || '',
      is_active: b.isActive !== undefined ? b.isActive : true,
    }).select().single();

    if (error) throw error;
    res.json({
      id: data.id,
      name: data.name,
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      schedule: data.schedule || '',
      image: data.image || '',
      isActive: data.is_active,
    });
  } catch (err) {
    console.error('[Branches] Error creating:', err);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const { data, error } = await supabaseAdmin.from('branches').update({
      name: b.name,
      address: b.address || '',
      phone: b.phone || '',
      email: b.email || '',
      schedule: b.schedule || '',
      image: b.image || '',
      is_active: b.isActive !== undefined ? b.isActive : true,
    }).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json({
      id: data.id,
      name: data.name,
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      schedule: data.schedule || '',
      image: data.image || '',
      isActive: data.is_active,
    });
  } catch (err) {
    console.error('[Branches] Error updating:', err);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('branches').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[Branches] Error deleting:', err);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

export default router;
