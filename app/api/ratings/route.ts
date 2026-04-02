import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const toProfileId = searchParams.get('to_profile_id');
  const fromProfileId = searchParams.get('from_profile_id'); // opcional

  if (!toProfileId) {
    return NextResponse.json({ error: 'to_profile_id required' }, { status: 400 });
  }

  // Obtener aggregate
  const { data: agg, error } = await supabase
    .rpc('get_profile_rating_stats', { p_to_profile_id: toProfileId })
    .maybeSingle<{ average: number; count: number }>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let myRating: number | null = null;
  if (fromProfileId) {
    const { data: myData } = await supabase
      .from('profile_ratings')
      .select('rating')
      .eq('from_profile_id', fromProfileId)
      .eq('to_profile_id', toProfileId)
      .maybeSingle();
    myRating = myData?.rating ?? null;
  }

  return NextResponse.json({
    average: agg?.average ?? 0,
    count: agg?.count ?? 0,
    my_rating: myRating,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to_profile_id, rating } = body;
    const from_profile_id = request.headers.get('x-profile-id'); // asumir que el cliente envía esto cabecera o podemos usar sesión

    if (!to_profile_id || !rating || typeof rating !== 'number' || rating < 1 || rating > 10) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    if (!from_profile_id) {
      return NextResponse.json({ error: 'from_profile_id missing' }, { status: 400 });
    }

    // Upsert rating
    const { data: existing } = await supabase
      .from('profile_ratings')
      .select('id')
      .eq('from_profile_id', from_profile_id)
      .eq('to_profile_id', to_profile_id)
      .maybeSingle();

    if (existing) {
      // Update
      const { error: updateErr } = await supabase
        .from('profile_ratings')
        .update({ rating })
        .eq('id', existing.id);
      if (updateErr) throw updateErr;
    } else {
      // Insert
      const { error: insertErr } = await supabase
        .from('profile_ratings')
        .insert({ from_profile_id, to_profile_id, rating });
      if (insertErr) throw insertErr;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const toProfileId = searchParams.get('to_profile_id');
  const fromProfileId = request.headers.get('x-profile-id');

  if (!toProfileId || !fromProfileId) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 });
  }

  const { error } = await supabase
    .from('profile_ratings')
    .delete()
    .eq('from_profile_id', fromProfileId)
    .eq('to_profile_id', toProfileId);

  if (error) throw error;

  return NextResponse.json({ ok: true });
}