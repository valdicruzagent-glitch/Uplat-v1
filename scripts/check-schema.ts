import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const envPath = process.env.ENV_PATH || '.env.local';
const envContent = require('fs').readFileSync(envPath, 'utf-8');
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

async function check() {
  // Check listing_favorites table existence
  try {
    const { count } = await sb.from('listing_favorites').select('*', { count: 'exact' }).limit(1);
    console.log(`listing_favorites exists (sample count: ${count})`);
  } catch (e) {
    console.log('listing_favorites missing');
  }

  // Check columns on listings
  const { data: colData } = await sb.rpc('pgtable_column_names', { table_name: 'listings' }).catch(() => ({ data: [] }));
  const cols = colData.map((c: any) => c.column_name);
  console.log('listings columns:', cols);
  const needAlter = [];
  if (!cols.includes('favorites_count')) needAlter.push('favorites_count');
  if (!cols.includes('is_sponsored')) needAlter.push('is_sponsored');
  if (!cols.includes('sponsor_rank')) needAlter.push('sponsor_rank');
  if (!cols.includes('sponsored_until')) needAlter.push('sponsored_until');
  if (needAlter.length) console.log('Missing listing columns:', needAlter);

  // Check RPC
  try {
    await sb.rpc('increment_favorites_count', { lid: '00000000-0000-0000-0000-000000000000', delta: 0 });
    console.log('increment_favorites_count exists');
  } catch (e) {
    console.log('increment_favorites_count missing');
  }

  sb.close();
}
check();
