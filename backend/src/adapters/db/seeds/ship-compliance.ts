import { pool } from '../client';

// Test ship compliance data to demonstrate Banking and Pooling functionality
// These represent computed CB records for different ships
const shipComplianceData = [
  {
    shipId: 'S001',
    year: 2025,
    cbGco2eq: 15000, // Positive balance (surplus) - can bank this
  },
  {
    shipId: 'S002', 
    year: 2025,
    cbGco2eq: -8000, // Negative balance (deficit) - needs credits
  },
  {
    shipId: 'S003',
    year: 2025,
    cbGco2eq: 12000, // Positive balance (surplus) - can bank this
  },
  {
    shipId: 'S004',
    year: 2025,
    cbGco2eq: -5000, // Negative balance (deficit) - needs credits
  },
  {
    shipId: 'S005',
    year: 2025,
    cbGco2eq: 8000, // Positive balance (surplus) - can bank this
  },
  // Additional year data for testing
  {
    shipId: 'S001',
    year: 2024,
    cbGco2eq: 10000,
  },
  {
    shipId: 'S002',
    year: 2024,
    cbGco2eq: -3000,
  },
];

export async function seedShipCompliance(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if ship compliance data already exists
    const existingData = await client.query('SELECT COUNT(*) FROM ship_compliance');
    const dataCount = parseInt(existingData.rows[0].count);
    
    if (dataCount > 0) {
      console.log(`⏭️  Ship compliance already seeded (${dataCount} records exist), skipping`);
      await client.query('ROLLBACK');
      return;
    }
    
    // Insert ship compliance data
    for (const compliance of shipComplianceData) {
      await client.query(
        `INSERT INTO ship_compliance (ship_id, year, cb_gco2eq, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [
          compliance.shipId,
          compliance.year,
          compliance.cbGco2eq,
        ]
      );
    }
    
    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${shipComplianceData.length} ship compliance records`);
    console.log('📊 Test data summary:');
    console.log('   - S001 (2025): +15,000 gCO₂e (surplus - can bank)');
    console.log('   - S002 (2025): -8,000 gCO₂e (deficit - needs credits)');
    console.log('   - S003 (2025): +12,000 gCO₂e (surplus - can bank)');
    console.log('   - S004 (2025): -5,000 gCO₂e (deficit - needs credits)');
    console.log('   - S005 (2025): +8,000 gCO₂e (surplus - can bank)');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ship compliance seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}