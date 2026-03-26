const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const [k, ...r] = line.split('=');
  if (k && r.length) env[k.trim()] = r.join('=').trim().replace(/^"|"$/g, '');
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or ANON_KEY');
  process.exit(1);
}

const sb = createClient(url, key);

async function verify() {
  console.log('=== Production Supabase Verification ===');

  // 1. listings columns existence check via direct query
  const required = ['favorites_count', 'is_sponsored', 'sponsor_rank', 'sponsored_until'];
  const missingCols = [];
  for (const col of required) {
    try {
      await sb.from('listings').select(col).limit(1);
    } catch (e) {
      if (e.message && (e.message.includes('does not exist') || e.code === '42703')) {
        missingCols.push(col);
      }
    }
  }
  console.log('Listings columns check (probed):', { missingCols });

  // 2. listing_favorites table
  try {
    const { data, error } = await sb.from('listing_favorites').select('*', { count: 'exact' }).limit(1);
    console.log('listing_favorites accessible:', !error, error ? error.message : '');
  } catch (e) {
    console.log('listing_favorites check error:', e.message);
  }

  // 3. increment_favorites_count function
  try {
    await sb.rpc('increment_favorites_count', { lid: '00000000-0000-0000-0000-000000000000', delta: 0 });
    console.log('increment_favorites_count exists: true');
  } catch (e) {
    console.log('increment_favorites_count exists: false', e.message);
  }

  // 4. Policies
  try {
    const { data } = await sb.rpc('pg_policies', { table_name: 'listing_favorites' });
    const policyNames = (data || []).map(p => p.policyname);
    console.log('Policies on listing_favorites:', policyNames);
  } catch (e) {
    console.log('Could not fetch policies:', e.message);
  }

  // 5. Test toggle if user exists
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
  } catch (e) {
    console.log('Toggle test error:', e.message);
  }
}
verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
