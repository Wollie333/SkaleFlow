#!/usr/bin/env node

/**
 * Run new migrations (109 and 110) against Supabase database
 * This script executes SQL files directly using the database connection
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ Missing SUPABASE_DB_URL in .env.local');
  process.exit(1);
}

const migrations = [
  'supabase/migrations/109_simplified_permissions_system.sql',
  'supabase/migrations/110_convert_user_to_beta.sql'
];

async function runMigrations() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');
    console.log('');

    for (const migrationFile of migrations) {
      const migrationPath = path.resolve(process.cwd(), migrationFile);

      if (!fs.existsSync(migrationPath)) {
        console.log(`⏭️  Skipping ${path.basename(migrationFile)} (not found)`);
        continue;
      }

      console.log(`📄 Running: ${path.basename(migrationFile)}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');

      try {
        const result = await client.query(sql);
        console.log(`✅ Success!`);

        if (result.rows && result.rows.length > 0) {
          console.log('📊 Result:', JSON.stringify(result.rows, null, 2));
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Already applied (skipping)`);
        } else {
          throw error;
        }
      }

      console.log('');
    }

    console.log('🎉 All migrations completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
