import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

function stripSensitive(u: any) {
  if (!u) return u;
  const { password, salt, ...clean } = u;
  return {
    id: clean.id || u.id,
    email: clean.email || u.email,
    name: clean.name || u.name,
    role: clean.role || u.role,
    active: clean.active ?? u.active,
    createdAt: clean.created_at || u.created_at,
  };
}

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const users = (data || []).map(stripSensitive);

    const hasAdmin = users.some((u: any) => u.email && u.email.toLowerCase() === 'annierfq01@gmail.com');
    if (!hasAdmin) {
      const adminSalt = crypto.randomBytes(32).toString('hex');
      const adminHash = crypto.pbkdf2Sync('admin', adminSalt, 10000, 64, 'sha256').toString('hex');
      const defaultAdmin = {
        id: 'admin-user',
        email: 'annierfq01@gmail.com',
        name: 'Annier FQ',
        role: 'admin',
        password: adminHash,
        salt: adminSalt,
        active: true,
        created_at: new Date().toISOString(),
      };
      await supabaseAdmin.from('users').upsert(defaultAdmin);
      users.unshift(stripSensitive(defaultAdmin));
    }

    res.json(users);
  } catch (err) {
    console.error('[Users] Error fetching:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id;
    delete updates.salt;

    const { data, error } = await supabaseAdmin.from('users').update(updates).eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw error;
    }
    res.json(stripSensitive(data));
  } catch (err) {
    console.error('[Users] Error updating:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const newUser = req.body;
    const { data: existingUsers } = await supabaseAdmin.from('users').select('*').eq('email', newUser.email);

    if (existingUsers && existingUsers.length > 0) {
      const existing = existingUsers[0];
      const { data, error } = await supabaseAdmin.from('users').update({
        name: newUser.name,
      }).eq('id', existing.id).select().single();

      if (error) throw error;
      return res.json(stripSensitive(data));
    }

    const userId = newUser.id || 'user-' + Date.now().toString();
    const userRole = newUser.email === 'annierfq01@gmail.com' ? 'admin' : (newUser.role || 'cliente');

    const { data, error } = await supabaseAdmin.from('users').upsert({
      id: userId,
      email: newUser.email,
      name: newUser.name,
      role: userRole,
      active: true,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    res.status(201).json(stripSensitive(data));
  } catch (err) {
    console.error('[Users] Error creating:', err);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

export default router;
