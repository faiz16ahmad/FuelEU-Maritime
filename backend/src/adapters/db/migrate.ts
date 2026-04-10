import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from './client';

const MIGRATIONS_DIR = join(__dirname, 'migrations');

const migrations = [
  '001_create_routes.sql',
  '002_create_ship_compliance.sql',
  '003_create_bank_entries.sql',
  '004_create_pools.sql',
  '005_create_pool_members.sql',
];

async function createMigrationsTable(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(query);
}

async function isMigrationExecuted(filename: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM migrations WHERE filename = $1',
    [filename]
  );
  return result.rows.length > 0;
}

async function executeMigration(filename: string): Promise<void> {
  const migrationPath = join(MIGRATIONS_DIR, filename);
  const sql = readFileSync(migrationPath, 'utf8');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [filename]
    );
    await client.query('COMMIT');
    console.log(`✅ Migration ${filename} executed successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration ${filename} failed:`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations(): Promise<void> {
  try {
    console.log('🚀 Starting database migrations...');
    
    await createMigrationsTable();
    
    for (const migration of migrations) {
      const isExecuted = await isMigrationExecuted(migration);
      if (!isExecuted) {
        await executeMigration(migration);
      } else {
        console.log(`⏭️  Migration ${migration} already executed, skipping`);
      }
    }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigrations };