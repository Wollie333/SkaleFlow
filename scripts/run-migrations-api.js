#!/usr/bin/env node

/**
 * Run new migrations via Supabase Management API
 * This bypasses the need for direct database connection
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = 'kviacenyqktgtgpoignj';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const migrations = [
  'supabase/migrations/109_simplified_permissions_system.sql',
  'supabase/migrations/110_convert_user_to_beta.sql'
];

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: 'kviacenyqktgtgpoignj.supabase.co',
      path: '/rest/v1/rpc/exec',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Length': data.length,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: responseData });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function executeSQLDirect(sql) {
  // Try using PostgREST to execute raw SQL
  // We'll use a workaround by executing via a custom query

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    try {
      console.log(`  Executing statement (${statement.substring(0, 50)}...)`);
      await executeSQL(statement);
    } catch (error) {
      if (error.message.includes('already exists') ||
          error.message.includes('duplicate')) {
        console.log('  ⚠️  Already exists (skipping)');
      } else {
        throw error;
      }
    }
  }
}

async function runMigrations() {
  console.log('🚀 Running migrations via Supabase API...');
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
      await executeSQLDirect(sql);
      console.log(`✅ Success!`);
    } catch (error) {
      console.error(`❌ Failed:`, error.message);
      // Continue with next migration
    }

    console.log('');
  }

  console.log('🎉 Migration process completed!');
}

runMigrations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
