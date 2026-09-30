/**
 * Reads an image file and returns a downscaled WebP (PNG fallback) data URL, small enough to
 * store in the database. `maxSide` bounds the longer edge in pixels.
 */
export async function fileToDataUrl(file: File, maxSide: number, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL('image/webp', quality);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

/** Approximate stored size of a data URL, in KB */
export const dataUrlKb = (s: string) => Math.round((s.length * 3) / 4 / 1024);
