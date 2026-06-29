import { Router } from 'express';
import sharp from 'sharp';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

async function compressImage(buffer: Buffer, maxBytes: number = 2 * 1024 * 1024): Promise<Buffer> {
  let quality = 85;
  let compressed = await sharp(buffer)
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (compressed.length > maxBytes && quality > 10) {
    quality -= 5;
    compressed = await sharp(buffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  if (compressed.length > maxBytes) {
    const scaleFactor = Math.sqrt(maxBytes / compressed.length) * 0.9;
    const metadata = await sharp(buffer).metadata();
    const newWidth = Math.round((metadata.width || 1920) * scaleFactor);
    const newHeight = Math.round((metadata.height || 1080) * scaleFactor);
    compressed = await sharp(buffer)
      .resize(newWidth, newHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  }

  return compressed;
}

router.post('/upload', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bucket, fileName, contentType, fileBase64 } = req.body;

    if (!bucket || !fileName || !fileBase64) {
      return res.status(400).json({ error: 'Missing required fields: bucket, fileName, fileBase64' });
    }

    let buffer = Buffer.from(fileBase64, 'base64');

    if (contentType && contentType.startsWith('image/')) {
      buffer = await compressImage(buffer);
    }

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
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
