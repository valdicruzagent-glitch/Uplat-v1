import { createClient } from 'supabase';

// Read secrets from local files
import { readFileSync } from 'fs';
const homedir = require('os').homedir();

const supabaseUrl = readFileSync(`${homedir}/.config/openclaw/secrets/supabase_url`, 'utf8').trim();
const serviceRoleKey = readFileSync(`${homedir}/.config/openclaw/secrets/supabase_service_role_key`, 'utf8').trim();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false },
});

const finca = {
  title: "Finca en Matagalpa",
  price_usd: 150000,
  area_m2: 10000,
  city: "Matagalpa",
  lat: 12.933,
  lng: -85.933,
  listing_type: "sale",
  property_type: "land",
  // optional fields can be omitted
};

async function insert() {
  const { data, error } = await supabase
    .from('listings')
    .insert(finca)
    .select()
    .single();
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  console.log('Inserted:', data);
}
insert();
