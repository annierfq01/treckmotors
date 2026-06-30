const ATTEMPT_SIZES = [720, 480, 320, 200];
const JPEG_QUALITY = 0.8;

export type CompressResult = { base64: string } | { raw: true; base64: string };

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function compressWithCanvas(file: File, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width < 10 || height < 10) throw new Error('Imagen inválida');

          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D no soportado');

          ctx.drawImage(img, 0, 0, width, height);

          let raw: string;
          try { raw = canvas.toDataURL('image/jpeg', JPEG_QUALITY); }
          catch {
            try { raw = canvas.toDataURL('image/png'); }
            catch { throw new Error('No se pudo exportar el canvas'); }
          }

          if (!raw || raw === 'data:,') throw new Error('Canvas generó imagen vacía');
          resolve(raw.split(',')[1]);
        } catch (err) { reject(err); }
      };
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function tryCanvasCompression(file: File): Promise<string | null> {
  try {
    if (!document.createElement('canvas').getContext) return Promise.resolve(null);
  } catch { return Promise.resolve(null); }

  return (async () => {
    for (const size of ATTEMPT_SIZES) {
      try { return await compressWithCanvas(file, size); }
      catch { continue; }
    }
    return null;
  })();
}

async function tryLibraryCompression(file: File): Promise<string | null> {
  try {
    const lib = await import('browser-image-compression');
    const compressedBlob = await lib.default(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 720,
      useWebWorker: true,
      fileType: 'image/jpeg',
    });
    if (compressedBlob && compressedBlob.size > 0) {
      return readAsBase64(new File([compressedBlob], file.name, { type: 'image/jpeg' }));
    }
  } catch (err) {
    console.warn('[Compress] Library fallback failed:', err);
  }
  return null;
}

export async function compressImage(file: File): Promise<CompressResult> {
  if (file.size === 0) throw new Error('El archivo está vacío');

  const canvasResult = await tryCanvasCompression(file);
  if (canvasResult) return { base64: canvasResult };

  const libResult = await tryLibraryCompression(file);
  if (libResult) return { base64: libResult };

  if (file.size < 2 * 1024 * 1024) {
    console.warn('[Compress] No se pudo comprimir, enviando original (<2MB)');
    const raw = await readAsBase64(file);
    return { raw: true, base64: raw };
  }

  const mb = (file.size / 1024 / 1024).toFixed(1);
  throw new Error(`La imagen pesa ${mb}MB y no pudo comprimirse en este dispositivo. Intenta con una imagen más pequeña.`);
}
