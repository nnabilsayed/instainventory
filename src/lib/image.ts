export function storageImage(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
  } = {},
): string | null {
  if (!url) return null;

  // Only transform Supabase Storage URLs
  if (!url.includes('/storage/v1/object/public/')) return url;

  const { width, height, quality = 75, resize = 'cover' } = options;

  // Convert object URL to render URL
  const renderUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/',
  );

  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('resize', resize);

  return `${renderUrl}?${params.toString()}`;
}
