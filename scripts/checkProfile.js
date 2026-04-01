import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  const envPath = join(process.cwd(), '.env.local');
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valParts] = line.split('=');
      if (key && valParts.length) {
        env[key.trim()] = valParts.join('=').trim();
      }
    }
  });
  return env;
}

const env = loadEnv();

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const discordId = '758128758808379443';

async function checkProfile() {
  // First, find the user ID from auth.identities where identity_id = discordId
  const { data: identities, error: identityError } = await supabase
    .from('auth.identities')
    .select('user_id, identity_id, provider')
    .eq('identity_id', discordId)
    .eq('provider', 'discord')
    .single();

  if (identityError || !identities) {
    console.error('Error fetching identity:', identityError || 'No identity found');
    process.exit(1);
  }

  const userId = identities.user_id;
  console.log('Found user ID from Discord identity:', userId);

  // Now fetch the profile
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, whatsapp_number')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    process.exit(1);
  }

  console.log('Profile for user', userId);
  console.log(JSON.stringify(data, null, 2));
}

checkProfile();
