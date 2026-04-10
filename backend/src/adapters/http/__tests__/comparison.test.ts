import request from 'supertest';
import { createApp } from '../app';
import { pool } from '../../db/client';
import { runMigrations } from '../../db/migrate';
import { runSeeds } from '../../db/seed';

describe('Comparison API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await runMigrations();
    await runSeeds();
    app = createApp();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /routes/comparison', () => {
    it('should return baseline and comparison routes with percentDiff and compliant', async () => {
      const response = await request(app)
        .get('/routes/comparison')
        .expect(200);

      expect(response.body).toHaveProperty('baseline');
      expect(response.body).toHaveProperty('comparisons');

      // Baseline should be R001 (91.0 gCO₂e/MJ)
      expect(response.body.baseline.routeId).toBe('R001');
      expect(response.body.baseline.ghgIntensity).toBe(91.0);

      // Should have 4 comparison routes
      expect(response.body.comparisons).toHaveLength(4);

      // Check R002 comparison (88.0 vs 91.0 baseline)
      const r002Comparison = response.body.comparisons.find(
        (c: any) => c.route.routeId === 'R002'
      );
      expect(r002Comparison).toBeDefined();
      expect(r002Comparison.route.ghgIntensity).toBe(88.0);
      
      // percentDiff = ((88.0 / 91.0) - 1) * 100 ≈ -3.297%
      expect(r002Comparison.percentDiff).toBeCloseTo(-3.297, 2);
      
      // R002 is compliant (88.0 ≤ 89.3368)
      expect(r002Comparison.compliant).toBe(true);

      // Check R003 comparison (93.5 vs 91.0 baseline)
      const r003Comparison = response.body.comparisons.find(
        (c: any) => c.route.routeId === 'R003'
      );
      expect(r003Comparison).toBeDefined();
      expect(r003Comparison.route.ghgIntensity).toBe(93.5);
      
      // percentDiff = ((93.5 / 91.0) - 1) * 100 ≈ 2.747%
      expect(r003Comparison.percentDiff).toBeCloseTo(2.747, 2);
      
      // R003 is non-compliant (93.5 > 89.3368)
      expect(r003Comparison.compliant).toBe(false);
    });

    it('should have correct structure for comparison results', async () => {
      const response = await request(app)
        .get('/routes/comparison')
        .expect(200);

      const comparison = response.body.comparisons[0];
      expect(comparison).toHaveProperty('route');
      expect(comparison).toHaveProperty('percentDiff');
      expect(comparison).toHaveProperty('compliant');
      
      expect(typeof comparison.percentDiff).toBe('number');
      expect(typeof comparison.compliant).toBe('boolean');
    });

    // Test case where no baseline exists would require clearing baseline first
    // This is more complex to test in integration, but the unit tests cover it
  });
});