import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    const reviews = (data || []).map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      userEmail: r.user_email,
      userName: r.user_name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    }));
    res.json(reviews);
  } catch (err) {
    console.error('[Reviews] Error fetching:', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const newReview = req.body;
    const reviewId = newReview.id || 'rev-' + Date.now();
    const createdAt = newReview.createdAt || new Date().toISOString();

    const { data, error } = await supabaseAdmin.from('reviews').upsert({
      id: reviewId,
      product_id: newReview.productId,
      user_email: newReview.userEmail,
      user_name: newReview.userName,
      rating: newReview.rating,
      comment: newReview.comment,
      created_at: createdAt,
    }).select().single();

    if (error) throw error;
    res.status(201).json({
      id: data.id,
      productId: data.product_id,
      userEmail: data.user_email,
      userName: data.user_name,
      rating: data.rating,
      comment: data.comment,
      createdAt: data.created_at,
    });
  } catch (err) {
    console.error('[Reviews] Error creating:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
