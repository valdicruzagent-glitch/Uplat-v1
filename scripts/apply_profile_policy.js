// Script to apply missing RLS policy for profiles table
// Usage: node scripts/apply_profile_policy.js

const { Client } = require('pg');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // Try reading from local file if env not set
    const fs = require('fs');
    const secretsPath = require('path').resolve(process.env.HOME || '/Users/belkiscruz', '.config/openclaw/secrets');
    if (!supabaseUrl) {
      try {
        supabaseUrl = fs.readFileSync(`${secretsPath}/supabase_url`, 'utf8').trim();
      } catch (e) { console.error('Missing supabase_url'); process.exit(1); }
    }
    if (!serviceRoleKey) {
      try {
        serviceRoleKey = fs.readFileSync(`${secretsPath}/supabase_service_role_key`, 'utf8').trim();
      } catch (e) { console.error('Missing supabase_service_role_key'); process.exit(1); }
    }
  }

  // Extract host and database from supabaseUrl: https://<project>.supabase.co
  const match = supabaseUrl.match(/https:\\/\\/([^./]+)\\.supabase\\.co/);
  if (!match) {
    console.error('Invalid supabase URL format:', supabaseUrl);
    process.exit(1);
  }
  const host = `${match[1]}.supabase.co`;
  const database = 'postgres'; // default

  const client = new Client({
    host,
    database,
    ssl: { rejectUnauthorized: false },
    user: 'service_role', // Supabase service role user
    password: serviceRoleKey,
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to Supabase DB');

    // 1) Ensure role is nullable (onboarding)
    await client.query(`ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;`);
    console.log('Made role column nullable');

    // 2) Drop existing insert policy if exists and recreate
    await client.query(`DROP POLICY IF EXISTS "users can insert own profile" ON public.profiles;`);
    console.log('Dropped old insert policy (if any)');

    await client.query(`
      CREATE POLICY "users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
    `);
    console.log('Created insert policy');

    // 3) Ensure update policy exists (might already)
    await client.query(`DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;`);
    await client.query(`
      CREATE POLICY "users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    `);
    console.log('Recreated update policy');

    // 4) Ensure select policy exists
    await client.query(`DROP POLICY IF EXISTS "users can read own profile" ON public.profiles;`);
    await client.query(`
      CREATE POLICY "users can read own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
    `);
    console.log('Recreated select policy');

    console.log('All policies ensured.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
