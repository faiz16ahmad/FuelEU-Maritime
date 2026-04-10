import { pool } from '../client';
import { runMigrations } from '../migrate';
import { runSeeds } from '../seed';
import { PgRouteRepository } from '../repositories/PgRouteRepository';
import { ResourceNotFoundError } from '@core/domain/errors';

describe('PgRouteRepository Integration Tests', () => {
  let repository: PgRouteRepository;

  beforeAll(async () => {
    await runMigrations();
    await runSeeds();
    repository = new PgRouteRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('findAll', () => {
    it('should return all 5 seeded routes', async () => {
      const routes = await repository.findAll();
      expect(routes).toHaveLength(5);
      expect(routes.map(r => r.routeId).sort()).toEqual(['R001', 'R002', 'R003', 'R004', 'R005']);
    });

    it('should return routes with correct structure', async () => {
      const routes = await repository.findAll();
      const route = routes[0];
      
      expect(route).toHaveProperty('id');
      expect(route).toHaveProperty('routeId');
      expect(route).toHaveProperty('year');
      expect(route).toHaveProperty('ghgIntensity');
      expect(route).toHaveProperty('isBaseline');
      expect(route).toHaveProperty('vesselType');
      expect(route).toHaveProperty('fuelType');
      expect(route).toHaveProperty('fuelConsumption');
      expect(route).toHaveProperty('distance');
      expect(route).toHaveProperty('totalEmissions');
    });
  });

  describe('findById', () => {
    it('should return route R001 with correct data', async () => {
      const route = await repository.findById('R001');
      
      expect(route).not.toBeNull();
      expect(route!.routeId).toBe('R001');
      expect(route!.vesselType).toBe('Container');
      expect(route!.fuelType).toBe('HFO');
      expect(route!.year).toBe(2024);
      expect(route!.ghgIntensity).toBe(91.0);
      expect(route!.isBaseline).toBe(true);
    });

    it('should return null for non-existent route', async () => {
      const route = await repository.findById('R999');
      expect(route).toBeNull();
    });
  });

  describe('findBaseline', () => {
    it('should return R001 as baseline route', async () => {
      const baseline = await repository.findBaseline();
      
      expect(baseline).not.toBeNull();
      expect(baseline!.routeId).toBe('R001');
      expect(baseline!.isBaseline).toBe(true);
    });
  });

  describe('findAllNonBaseline', () => {
    it('should return 4 non-baseline routes', async () => {
      const nonBaseline = await repository.findAllNonBaseline();
      
      expect(nonBaseline).toHaveLength(4);
      expect(nonBaseline.every(r => !r.isBaseline)).toBe(true);
      expect(nonBaseline.map(r => r.routeId).sort()).toEqual(['R002', 'R003', 'R004', 'R005']);
    });
  });

  describe('setBaseline', () => {
    it('should set R002 as new baseline', async () => {
      const updatedRoute = await repository.setBaseline('R002');
      
      expect(updatedRoute.routeId).toBe('R002');
      expect(updatedRoute.isBaseline).toBe(true);
      
      // Verify R001 is no longer baseline
      const oldBaseline = await repository.findById('R001');
      expect(oldBaseline!.isBaseline).toBe(false);
      
      // Verify only one baseline exists
      const allRoutes = await repository.findAll();
      const baselineRoutes = allRoutes.filter(r => r.isBaseline);
      expect(baselineRoutes).toHaveLength(1);
      expect(baselineRoutes[0].routeId).toBe('R002');
    });

    it('should throw ResourceNotFoundError for non-existent route', async () => {
      await expect(repository.setBaseline('R999')).rejects.toThrow(ResourceNotFoundError);
    });

    // Reset baseline back to R001 for other tests
    afterAll(async () => {
      await repository.setBaseline('R001');
    });
  });
});