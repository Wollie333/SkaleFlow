#!/usr/bin/env node

/**
 * Run a specific SQL migration file against Supabase database
 * Usage: node scripts/run-migration.js <migration-file-path>
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Usage: node scripts/run-migration.js <migration-file-path>');
  console.error('   Example: node scripts/run-migration.js supabase/migrations/109_simplified_permissions_system.sql');
  process.exit(1);
}

const migrationPath = path.resolve(process.cwd(), migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

console.log(`📄 Reading migration file: ${path.basename(migrationPath)}`);
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log(`🚀 Running migration against database...`);
console.log(`   URL: ${supabaseUrl}`);
console.log(`   File: ${path.basename(migrationPath)}`);
console.log('');

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    // Execute the SQL using rpc with a custom function
    // Or use the raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      console.log('✅ Migration executed successfully!');
      return;
    }

    console.log('✅ Migration executed successfully!');
    if (data) {
      console.log('📊 Result:', data);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
