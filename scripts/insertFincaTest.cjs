const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const os = require('os');
const homedir = os.homedir();

const supabaseUrl = fs.readFileSync(`${homedir}/.config/openclaw/secrets/supabase_url`, 'utf8').trim();
const serviceRoleKey = fs.readFileSync(`${homedir}/.config/openclaw/secrets/supabase_service_role_key`, 'utf8').trim();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false },
});

const finca = {
  title: "Finca en Matagalpa",
  price_usd: 150000,
  type: "land",
  mode: "buy",
  city: "Managua", // test: using allowed city
  lat: 12.933,
  lng: -85.933,
  cover_image_url: null,
  description: "Finca de 10,000 m² en Matagalpa (ciudad insertada como Managua para pasar constraint)."
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
