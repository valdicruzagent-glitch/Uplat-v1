import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get('listingId');
  if (!listingId) return NextResponse.json({ error: 'missing listingId' }, { status: 400 });

  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'listing_view')
    .eq('listing_id', listingId);

  if (error) {
    console.error('[listing-views] count error', error);
    return NextResponse.json({ error: 'count_failed' }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const listingId = body?.listingId;
  const visitorId = body?.visitorId;

  if (!listingId || !visitorId) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const existing = await supabase
    .from('events')
    .select('id')
    .eq('type', 'listing_view')
    .eq('listing_id', listingId)
    .eq('meta->>visitor_id', visitorId)
    .limit(1)
    .maybeSingle();

  if (existing.error) {
    console.error('[listing-views] existing check error', existing.error);
    return NextResponse.json({ error: 'check_failed' }, { status: 500 });
  }

  if (!existing.data) {
    const { error } = await supabase.from('events').insert({
      type: 'listing_view',
      listing_id: listingId,
      meta: { visitor_id: visitorId },
    });

    if (error) {
      console.error('[listing-views] insert error', error);
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
    }
  }

  const { count, error } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'listing_view')
    .eq('listing_id', listingId);

  if (error) {
    console.error('[listing-views] post-count error', error);
    return NextResponse.json({ error: 'count_failed' }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
