import { getSupabaseClient } from '@/lib/supabaseClient';

export async function uploadListingPhotos(
  params: { userId: string; files: File[]; listingId?: string; onProgress?: (percent: number) => void }
): Promise<string[]> {
  const supabase = getSupabaseClient();
  const bucket = 'listing-photos';
  const urls: string[] = [];

  for (let i = 0; i < params.files.length; i++) {
    const file = params.files[i];
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const path = `${userId}/${fileName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    urls.push(data.publicUrl);

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100));
    }
  }

  return urls;
}
