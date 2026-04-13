import { seedRoutes } from './seeds/routes';
import { seedShipCompliance } from './seeds/ship-compliance';

async function runSeeds(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...');
    
    await seedRoutes();
    await seedShipCompliance();
    
    console.log('✅ All seeds completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeds if this file is executed directly
if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runSeeds };