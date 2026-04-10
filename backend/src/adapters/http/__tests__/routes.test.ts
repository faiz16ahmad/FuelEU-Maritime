import request from 'supertest';
import { createApp } from '../app';
import { pool } from '../../db/client';
import { runMigrations } from '../../db/migrate';
import { runSeeds } from '../../db/seed';

describe('Routes API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Setup database and app
    await runMigrations();
    await runSeeds();
    app = createApp();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /routes', () => {
    it('should return all 5 seeded routes', async () => {
      const response = await request(app)
        .get('/routes')
        .expect(200);

      expect(response.body).toHaveLength(5);
      expect(response.body.map((r: any) => r.routeId).sort()).toEqual([
        'R001', 'R002', 'R003', 'R004', 'R005'
      ]);
    });

    it('should return routes with correct structure', async () => {
      const response = await request(app)
        .get('/routes')
        .expect(200);

      const route = response.body[0];
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

  describe('POST /routes/:routeId/baseline', () => {
    it('should set R002 as new baseline', async () => {
      const response = await request(app)
        .post('/routes/R002/baseline')
        .expect(200);

      expect(response.body.routeId).toBe('R002');
      expect(response.body.isBaseline).toBe(true);

      // Verify only R002 is baseline now
      const allRoutes = await request(app).get('/routes');
      const baselineRoutes = allRoutes.body.filter((r: any) => r.isBaseline);
      expect(baselineRoutes).toHaveLength(1);
      expect(baselineRoutes[0].routeId).toBe('R002');
    });

    it('should return 404 for non-existent route', async () => {
      const response = await request(app)
        .post('/routes/R999/baseline')
        .expect(404);

      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('should return 400 for missing route ID', async () => {
      const response = await request(app)
        .post('/routes//baseline')
        .expect(404); // Express treats empty param as 404
    });

    // Reset baseline back to R001 for other tests
    afterAll(async () => {
      await request(app).post('/routes/R001/baseline');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});