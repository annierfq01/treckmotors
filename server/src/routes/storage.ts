import { Router } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/upload', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bucket, fileName, contentType, fileBase64 } = req.body;

    if (!bucket || !fileName || !fileBase64) {
      return res.status(400).json({ error: 'Missing required fields: bucket, fileName, fileBase64' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: contentType || 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrl } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    res.json({
      url: publicUrl.publicUrl,
      path: data?.path,
    });
  } catch (err) {
    console.error('[Storage] Upload error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

router.delete('/delete', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bucket, filePath } = req.body;
    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'Missing required fields: bucket, filePath' });
    }

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[Storage] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
