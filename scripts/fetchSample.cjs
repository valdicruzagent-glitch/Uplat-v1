const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const os = require('os');
const homedir = os.homedir();

const supabaseUrl = fs.readFileSync(`${homedir}/.config/openclaw/secrets/supabase_url`, 'utf8').trim();
const serviceRoleKey = fs.readFileSync(`${homedir}/.config/openclaw/secrets/supabase_service_role_key`, 'utf8').trim();

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false },
});

(async () => {
  const { data, error } = await supabase.from('listings').select('*').limit(1).maybeSingle();
  if (error) {
    console.error('Fetch error:', error.message);
    process.exit(1);
  }
  if (!data) {
    console.log('No rows found');
    return;
  }
  console.log('Sample listing keys:', Object.keys(data));
  console.log('Sample values:', data);
})();
