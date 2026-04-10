import { pool } from '../client';
import { runMigrations } from '../migrate';
import { runSeeds } from '../seed';

describe('Database Seeds', () => {
  beforeAll(async () => {
    await runMigrations();
    await runSeeds();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should seed exactly five routes', async () => {
    const result = await pool.query('SELECT COUNT(*) FROM routes');
    expect(parseInt(result.rows[0].count)).toBe(5);
  });

  it('should have R001 as the baseline route', async () => {
    const result = await pool.query(`
      SELECT route_id, is_baseline 
      FROM routes 
      WHERE is_baseline = true
    `);
    
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].route_id).toBe('R001');
    expect(result.rows[0].is_baseline).toBe(true);
  });

  it('should have all expected routes with correct data', async () => {
    const expectedRoutes = [
      { routeId: 'R001', vesselType: 'Container', fuelType: 'HFO', year: 2024, ghgIntensity: 91.0 },
      { routeId: 'R002', vesselType: 'BulkCarrier', fuelType: 'LNG', year: 2024, ghgIntensity: 88.0 },
      { routeId: 'R003', vesselType: 'Tanker', fuelType: 'MGO', year: 2024, ghgIntensity: 93.5 },
      { routeId: 'R004', vesselType: 'RoRo', fuelType: 'HFO', year: 2025, ghgIntensity: 89.2 },
      { routeId: 'R005', vesselType: 'Container', fuelType: 'LNG', year: 2025, ghgIntensity: 90.5 },
    ];

    for (const expected of expectedRoutes) {
      const result = await pool.query(`
        SELECT route_id, vessel_type, fuel_type, year, ghg_intensity
        FROM routes 
        WHERE route_id = $1
      `, [expected.routeId]);
      
      expect(result.rows).toHaveLength(1);
      const route = result.rows[0];
      expect(route.route_id).toBe(expected.routeId);
      expect(route.vessel_type).toBe(expected.vesselType);
      expect(route.fuel_type).toBe(expected.fuelType);
      expect(route.year).toBe(expected.year);
      expect(parseFloat(route.ghg_intensity)).toBe(expected.ghgIntensity);
    }
  });

  it('should have only one baseline route', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) 
      FROM routes 
      WHERE is_baseline = true
    `);
    
    expect(parseInt(result.rows[0].count)).toBe(1);
  });

  it('should have four non-baseline routes', async () => {
    const result = await pool.query(`
      SELECT COUNT(*) 
      FROM routes 
      WHERE is_baseline = false
    `);
    
    expect(parseInt(result.rows[0].count)).toBe(4);
  });
});