import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 200 });

  const { data, error } = await supabase
    .from('listing_favorites')
    .select('listing_id')
    .eq('user_id', user.id);

  if (error) {
    console.error('[favorites][GET] error', error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json((data || []).map((r) => r.listing_id));
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { listing_id } = await req.json();
  if (!listing_id) return NextResponse.json({ error: 'missing listing_id' }, { status: 400 });

  const { data: existing, error: selErr } = await supabase
    .from('listing_favorites')
    .select('id')
    .eq('listing_id', listing_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (selErr && selErr.code !== 'PGRST116') {
    console.error('[favorites][POST] check failed', selErr);
    return NextResponse.json({ error: 'check_failed' }, { status: 500 });
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from('listing_favorites')
      .delete()
      .eq('id', existing.id);

    if (delErr) {
      console.error('[favorites][POST] delete failed', delErr);
      return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
    }

    try {
      await supabase.rpc('increment_favorites_count', { lid: listing_id, delta: -1 });
    } catch (e) {
      console.error('[favorites][POST] rpc decrement error', e);
    }

    return NextResponse.json({ action: 'deleted' });
  }

  const { error: insErr } = await supabase
    .from('listing_favorites')
    .insert({ listing_id, user_id: user.id });

  if (insErr) {
    console.error('[favorites][POST] insert failed', insErr);
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  }

  try {
    await supabase.rpc('increment_favorites_count', { lid: listing_id, delta: 1 });
  } catch (e) {
    console.error('[favorites][POST] rpc increment error', e);
  }

  return NextResponse.json({ action: 'added' });
}
