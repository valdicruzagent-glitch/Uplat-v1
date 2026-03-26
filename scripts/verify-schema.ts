import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const [k, ...r] = line.split('=');
  if (k && r.length) env[k.trim()] = r.join('=').trim().replace(/^"|"$/g, '');
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Missing SUPABASE_URL or ANON_KEY');

const sb: SupabaseClient = createClient(url, key);

async function verify() {
  console.log('=== Production Supabase Verification ===');

  // 1. listings columns
  let colNames: string[] = [];
  try {
    const { data } = await sb.rpc('pgtable_column_names', { table_name: 'listings' });
    colNames = (data || []).map((c: any) => c.column_name);
  } catch (e) {
    console.log('Error fetching columns:', e);
  }
  const required = ['favorites_count', 'is_sponsored', 'sponsor_rank', 'sponsored_until'];
  const missingCols = required.filter(c => !colNames.includes(c));
  console.log('Listings columns check:', { colNames: colNames.sort(), missingCols });

  // 2. listing_favorites table
  let lfOk = false;
  try {
    const { data, error } = await sb.from('listing_favorites').select('*', { count: 'exact' }).limit(1);
    lfOk = !error && data !== null;
    console.log('listing_favorites table exists & accessible:', lfOk, error || '');
  } catch (e: any) {
    console.log('listing_favorites check error:', e.message);
  }

  // 3. increment_favorites_count function
  try {
    await sb.rpc('increment_favorites_count', { lid: '00000000-0000-0000-0000-000000000000', delta: 0 });
    console.log('increment_favorites_count exists: true');
  } catch (e: any) {
    console.log('increment_favorites_count exists: false', e.message);
  }

  // 4. Policies
  try {
    const { data } = await sb.rpc('pg_policies', { table_name: 'listing_favorites' });
    const policyNames = (data || []).map((p: any) => p.policyname);
    console.log('Policies on listing_favorites:', policyNames);
  } catch (e: any) {
    console.log('Could not fetch policies:', e.message);
  }

  // 5. Test favorite toggle if there's an auth user
  try {
    const { data: { user } } = await sb.auth.getUser();
    console.log('Auth user in this connection:', user ? user.id : 'none');
    if (user) {
      const { data: list } = await sb.from('listings').select('id').limit(1).single();
      const testListingId = list?.id;
      console.log('Test listing id:', testListingId);
      if (testListingId) {
        const { data: existing } = await sb.from('listing_favorites').select('id').eq('listing_id', testListingId).eq('user_id', user.id).maybeSingle();
        const exists = !!existing;
        console.log('Existing favorite:', exists);
        if (!exists) {
          const { error: insErr } = await sb.from('listing_favorites').insert({ listing_id: testListingId, user_id: user.id });
          console.log('Insert result:', insErr ? insErr.message : 'ok');
          if (!insErr) {
            const { data: after } = await sb.from('listings').select('favorites_count').eq('id', testListingId).single();
            console.log('favorites_count after insert:', after?.favorites_count);
            // cleanup
            await sb.from('listing_favorites').delete().eq('listing_id', testListingId).eq('user_id', user.id);
            console.log('Cleaned up test favorite');
          }
        } else {
          console.log('Skipping insert; already favorited');
        }
      } else {
        console.log('No listing to test');
      }
    } else {
      console.log('No auth user; skipping toggle test');
    }
  } catch (e: any) {
    console.log('Toggle test error:', e.message);
  }
}
verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
