import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { cookie: cookieStore.toString() } }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 200 });

  const { data } = await supabase
    .from('listing_favorites')
    .select('listing_id')
    .eq('user_id', user.id);
  return NextResponse.json((data || []).map((r) => r.listing_id));
}

export async function POST(req: Request) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { cookie: req.headers.get('cookie') || '' } }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { listing_id } = await req.json();
  if (!listing_id) return NextResponse.json({ error: 'missing listing_id' }, { status: 400 });

  // Check existing
  const { data: existing, error: selErr } = await supabase
    .from('listing_favorites')
    .select('id')
    .eq('listing_id', listing_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (selErr && selErr.code !== 'PGRST116') {
    console.error('Favorite check failed', selErr);
    return NextResponse.json({ error: 'check_failed' }, { status: 500 });
  }

  let result;
  if (existing) {
    // Remove
    const { error: delErr } = await supabase.from('listing_favorites').delete().eq('id', existing.id);
    if (delErr) {
      console.error('Delete favorite failed', delErr);
      return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
    }
    // Decrement favorites_count via RPC
    try {
      await supabase.rpc('increment_favorites_count', { lid: listing_id, delta: -1 });
    } catch (e) {
      console.error('RPC decrement error', e);
    }
    result = { action: 'deleted' };
  } else {
    // Add
    const { error: insErr } = await supabase.from('listing_favorites').insert({ listing_id, user_id: user.id });
    if (insErr) {
      console.error('Insert favorite failed', insErr);
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
    }
    // Increment favorites_count via RPC
    try {
      await supabase.rpc('increment_favorites_count', { lid: listing_id, delta: 1 });
    } catch (e) {
      console.error('RPC increment error', e);
    }
    result = { action: 'added' };
  }
  return NextResponse.json(result);
}
