import { Router } from 'express';
import { supabaseAdmin, deleteStorageImage } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('products').select('*');
    if (error) throw error;
    const products = (data || []).map((p: any) => ({
      id: p.id,
      type: p.type,
      name: p.name,
      price: p.price,
      currency: p.currency || 'USD',
      image: p.image,
      description: p.description,
      category: p.category,
      stock: p.stock,
      features: p.features || [],
      rating: p.rating,
      reviewsCount: p.reviews_count,
    }));
    res.json(products);
  } catch (err) {
    console.error('[Products] Error fetching:', err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const newProduct = req.body;
    if (!newProduct.id) {
      newProduct.id = 'prod-' + Date.now().toString();
    }
    const { data, error } = await supabaseAdmin.from('products').upsert({
      id: newProduct.id,
      type: newProduct.type,
      name: newProduct.name,
      price: newProduct.price,
      currency: newProduct.currency || 'USD',
      image: newProduct.image,
      description: newProduct.description,
      category: newProduct.category,
      stock: newProduct.stock ?? 0,
      features: newProduct.features || [],
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('[Products] Error creating:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id;

    const { data: old } = await supabaseAdmin.from('products').select('image').eq('id', id).single();

    const { data, error } = await supabaseAdmin.from('products').update({
      ...updates,
      features: updates.features || [],
    }).eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }

    if (old && old.image && old.image !== data.image) {
      await deleteStorageImage(old.image);
    }

    res.json(data);
  } catch (err) {
    console.error('[Products] Error updating:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: old } = await supabaseAdmin.from('products').select('image').eq('id', id).single();

    const { data, error } = await supabaseAdmin.from('products').delete().eq('id', id).select().single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }

    if (old && old.image) {
      await deleteStorageImage(old.image);
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('[Products] Error deleting:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
