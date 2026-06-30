import { Router } from 'express';
import sharp from 'sharp';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

function stepError(step: string, original: unknown): string {
  const msg = original instanceof Error ? original.message : String(original);
  return `[${step}] ${msg}`;
}

async function compressImage(buffer: Buffer, maxBytes: number = 2 * 1024 * 1024): Promise<Buffer> {
  try {
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
  } catch (err) {
    throw new Error(stepError('Sharp compress', err));
  }
}

router.post('/upload', requireAuth, requireAdmin, async (req, res) => {
  const logTag = `[Upload ${Date.now()}]`;
  try {
    const { bucket, fileName, contentType, fileBase64 } = req.body;

    if (!bucket || !fileName || !fileBase64) {
      console.error(`${logTag} Missing fields:`, { hasBucket: !!bucket, hasFileName: !!fileName, hasBase64: !!fileBase64 });
      return res.status(400).json({ error: 'Faltan campos requeridos: bucket, fileName, fileBase64', step: 'validation' });
    }

    console.log(`${logTag} Starting: bucket=${bucket}, fileName=${fileName}, base64Length=${fileBase64.length}`);

    let buffer: Buffer;
    try {
      buffer = Buffer.from(fileBase64, 'base64');
    } catch (err) {
      console.error(`${logTag} Base64 decode failed:`, err);
      return res.status(400).json({ error: 'Error al decodificar la imagen', detail: err instanceof Error ? err.message : String(err), step: 'base64_decode' });
    }

    console.log(`${logTag} Base64 decoded: ${buffer.length} bytes`);

    if (buffer.length === 0) {
      return res.status(400).json({ error: 'La imagen está vacía después de decodificar', step: 'empty_buffer' });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'La imagen supera los 10MB después de decodificar', step: 'size_limit' });
    }

    if (contentType && contentType.startsWith('image/') && buffer.length > 2 * 1024 * 1024) {
      try {
        const before = buffer.length;
        buffer = await compressImage(buffer);
        console.log(`${logTag} Server compressed: ${before} → ${buffer.length} bytes`);
      } catch (err) {
        console.error(`${logTag} Server compression failed (continuing with original):`, err);
      }
    }

    console.log(`${logTag} Uploading to Supabase bucket=${bucket}...`);
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error(`${logTag} Supabase upload error:`, error);
      return res.status(500).json({ error: 'Error al subir a Supabase Storage', detail: error.message, step: 'supabase_upload' });
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`${logTag} Success:`, publicUrl.publicUrl);

    res.json({
      url: publicUrl.publicUrl,
      path: data?.path,
    });
  } catch (err) {
    console.error(`${logTag} Unexpected error:`, err);
    res.status(500).json({ error: 'Error interno del servidor al subir archivo', detail: err instanceof Error ? err.message : String(err), step: 'unexpected' });
  }
});

router.delete('/delete', requireAuth, requireAdmin, async (req, res) => {
  const logTag = `[Delete ${Date.now()}]`;
  try {
    const { bucket, filePath } = req.body;
    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'Missing required fields: bucket, filePath', step: 'validation' });
    }

    console.log(`${logTag} Deleting: bucket=${bucket}, path=${filePath}`);
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`${logTag} Supabase delete error:`, error);
      return res.status(500).json({ error: 'Error al eliminar de Supabase', detail: error.message, step: 'supabase_delete' });
    }

    console.log(`${logTag} Deleted successfully`);
    res.json({ success: true });
  } catch (err) {
    console.error(`${logTag} Unexpected error:`, err);
    res.status(500).json({ error: 'Error interno al eliminar archivo', detail: err instanceof Error ? err.message : String(err), step: 'unexpected' });
  }
});

export default router;
