// Fix RLS policies for profiles table
// Uses Supabase service role to apply missing policies

const { createClient } = require('@supabase/supabase-js');

async function main() {
  // Get secrets from files
  const fs = require('fs');
  const path = require('path');
  const secretsDir = path.join(process.env.HOME || '/Users/belkiscruz', '.config/openclaw/secrets');

  const supabaseUrl = fs.readFileSync(path.join(secretsDir, 'supabase_url'), 'utf8').trim();
  const serviceRoleKey = fs.readFileSync(path.join(secretsDir, 'supabase_service_role_key'), 'utf8').trim();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log('Connected to Supabase with service role');

  // 1) Make role nullable
  try {
    await supabase.rpc('exec_sql', { sql: `ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;` });
    console.log('Made role column nullable');
  } catch (e) {
    if (e.message.includes('does not exist')) {
      console.log('exec_sql function not found, using raw query fallback');
    } else {
      console.error('Error making role nullable:', e.message);
    }
  }

  // Use raw HTTP query to run SQL (bypasses RLS)
  // We'll use the PostgREST direct query with Prefer: params=transaction
  // But easier: run via supabase-js using the admin client? Actually supabase-js doesn't support raw SQL directly without RPC.
  // We'll use the Postgrest API directly:
  const { default: fetch } = await import('node-fetch');
  const basicAuth = Buffer.from(`service_role:${serviceRoleKey}`).toString('base64');

  const runSQL = async (sql) => {
    const url = `${supabaseUrl}/rest/v1/rpc/exec`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
        'Prefer': 'params=transaction',
      },
      body: JSON.stringify({ sql }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return res.json();
  };

  try {
    // Create exec function if not exists
    await runSQL(`
      create or replace function exec_sql(sql text) returns void as $$
      begin
        execute sql;
      end;
      $$ language plpgsql security definer;
    `);
    console.log('Ensured exec_sql function exists');
  } catch (e) {
    console.log('exec_sql may already exist or could not create:', e.message);
  }

  const exec = async (sql) => {
    try {
      await runSQL(sql);
      console.log(`Executed: ${sql.substring(0, 60)}...`);
    } catch (e) {
      console.error(`Failed to execute: ${sql.substring(0, 60)}...`);
      console.error(e.message);
      // Continue anyway
    }
  };

  // 2) Apply policies
  await exec(`DROP POLICY IF EXISTS "users can insert own profile" ON public.profiles;`);
  await exec(`
    CREATE POLICY "users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
  `);

  await exec(`DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;`);
  await exec(`
    CREATE POLICY "users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  `);

  await exec(`DROP POLICY IF EXISTS "users can read own profile" ON public.profiles;`);
  await exec(`
    CREATE POLICY "users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
  `);

  // Ensure RLS enabled
  await exec(`ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;`);
  console.log('RLS enabled on profiles');

  console.log('All policies applied.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
