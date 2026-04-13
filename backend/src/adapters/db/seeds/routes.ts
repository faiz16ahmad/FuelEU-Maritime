import { pool } from '../client';

// Seed data from assignment brief - exact values from KPIs Dataset table
const routeData = [
  {
    routeId: 'R001',
    vesselType: 'Container',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 91.0,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: true, // R001 is the default baseline
  },
  {
    routeId: 'R002',
    vesselType: 'BulkCarrier',
    fuelType: 'LNG',
    year: 2024,
    ghgIntensity: 88.0,
    fuelConsumption: 4800,
    distance: 11500,
    totalEmissions: 4200,
    isBaseline: false,
  },
  {
    routeId: 'R003',
    vesselType: 'Tanker',
    fuelType: 'MGO',
    year: 2024,
    ghgIntensity: 93.5,
    fuelConsumption: 5100,
    distance: 12500,
    totalEmissions: 4700,
    isBaseline: false,
  },
  {
    routeId: 'R004',
    vesselType: 'RoRo',
    fuelType: 'HFO',
    year: 2025,
    ghgIntensity: 89.2,
    fuelConsumption: 4900,
    distance: 11800,
    totalEmissions: 4300,
    isBaseline: false,
  },
  {
    routeId: 'R005',
    vesselType: 'Container',
    fuelType: 'LNG',
    year: 2025,
    ghgIntensity: 90.5,
    fuelConsumption: 4950,
    distance: 11900,
    totalEmissions: 4400,
    isBaseline: false,
  },
];

export async function seedRoutes(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if routes already exist
    const existingRoutes = await client.query('SELECT COUNT(*) FROM routes');
    const routeCount = parseInt(existingRoutes.rows[0].count);
    
    if (routeCount > 0) {
      console.log(`⏭️  Routes already seeded (${routeCount} routes exist), skipping`);
      await client.query('ROLLBACK');
      return;
    }
    
    // Insert all routes
    for (const route of routeData) {
      await client.query(
        `INSERT INTO routes (
          route_id, vessel_type, fuel_type, year, ghg_intensity,
          fuel_consumption, distance, total_emissions, is_baseline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          route.routeId,
          route.vesselType,
          route.fuelType,
          route.year,
          route.ghgIntensity,
          route.fuelConsumption,
          route.distance,
          route.totalEmissions,
          route.isBaseline,
        ]
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${routeData.length} routes (R001 set as baseline)`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Route seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}