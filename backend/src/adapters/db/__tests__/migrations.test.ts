import { pool } from '../client';
import { runMigrations } from '../migrate';

describe('Database Migrations', () => {
  beforeAll(async () => {
    // Run migrations before tests
    await runMigrations();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should create all five required tables', async () => {
    const expectedTables = [
      'routes',
      'ship_compliance', 
      'bank_entries',
      'pools',
      'pool_members'
    ];

    for (const tableName of expectedTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      expect(result.rows[0].exists).toBe(true);
    }
  });

  it('should create migrations tracking table', async () => {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migrations'
      );
    `);
    
    expect(result.rows[0].exists).toBe(true);
  });

  it('should have correct routes table structure', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'routes'
      ORDER BY ordinal_position;
    `);
    
    const columns = result.rows;
    expect(columns.find(c => c.column_name === 'id')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'route_id')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'year')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'ghg_intensity')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'is_baseline')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'vessel_type')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'fuel_type')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'fuel_consumption')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'distance')).toBeTruthy();
    expect(columns.find(c => c.column_name === 'total_emissions')).toBeTruthy();
  });

  it('should have foreign key constraint on pool_members', async () => {
    const result = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'pool_members' 
      AND constraint_type = 'FOREIGN KEY';
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
  });
});