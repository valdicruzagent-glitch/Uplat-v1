import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadEnv() {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    throw new Error(`Env file not found: ${envPath}`);
  }
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

const migrationName = process.argv[2];
if (!migrationName) {
  console.error('Usage: node apply_migration.js <migration_name.sql>');
  process.exit(1);
}

const migrationPath = join(process.cwd(), 'scripts', 'db', 'migrations', migrationName);
if (!existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const sql = readFileSync(migrationPath, 'utf-8');

async function runMigration() {
  console.log(`Applying migration: ${migrationName}`);
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
  console.log('Migration applied successfully.');
}

runMigration().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
