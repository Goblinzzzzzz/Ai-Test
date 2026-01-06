#!/usr/bin/env node

/**
 * Database Migration Runner for Railway
 * 
 * This script connects to the Railway Postgres database and runs the migration.
 * 
 * Usage:
 *   node run-migration.js
 * 
 * Or with Railway CLI:
 *   railway run node server/run-migration.js
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error('');
    console.error('Please run this script with Railway CLI:');
    console.error('  railway run node server/run-migration.js');
    console.error('');
    console.error('Or set DATABASE_URL manually:');
    console.error('  DATABASE_URL="your-connection-string" node server/run-migration.js');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database successfully');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'init.sql');
    console.log(`📄 Reading migration file: ${migrationPath}`);
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Run migration
    console.log('🚀 Running migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'ai_assessments'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table "ai_assessments" created successfully');
    } else {
      console.log('⚠️  Warning: Table "ai_assessments" not found after migration');
    }
    
    // Verify view was created
    const viewResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'ai_assessment_public_stats'
    `);
    
    if (viewResult.rows.length > 0) {
      console.log('✅ View "ai_assessment_public_stats" created successfully');
    }
    
    console.log('');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('You can now:');
    console.log('  1. Visit your application URL');
    console.log('  2. Complete an assessment');
    console.log('  3. View statistics');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
