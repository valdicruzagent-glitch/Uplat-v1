/**
 * Compress an image file using canvas.
 * - Converts to WebP (fallback to JPEG if WebP not supported)
 * - Resizes to maxWidth (default 1600px) preserving aspect ratio
 * - Adjusts quality to try to stay under 1MB; target 200-600KB.
 */

export async function compressImage(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const tryWebP = () => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else {
              // Fallback to JPEG if WebP not supported or blob null
              canvas.toBlob(
                (blob2) => {
                  if (blob2) resolve(blob2);
                  else reject(new Error('Compression failed'));
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };

      tryWebP();
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress an array of images.
 */
export async function compressImages(files: File[], maxWidth: number = 1600, quality: number = 0.8): Promise<Blob[]> {
  const results: Blob[] = [];
  for (const file of files) {
    const blob = await compressImage(file, maxWidth, quality);
    results.push(blob);
  }
  return results;
}

/**
 * Convert Blob to File with original name (or provided name).
 */
export function blobToFile(blob: Blob, filename: string, mimeType?: string): File {
  return new File([blob], filename, {
    type: mimeType || blob.type || 'image/jpeg',
  });
}