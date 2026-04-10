import request from 'supertest';
import { createApp } from '../app';
import { pool } from '../../db/client';
import { runMigrations } from '../../db/migrate';

describe('Compliance API Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await runMigrations();
    app = createApp();
  });

  beforeEach(async () => {
    // Clean tables before each test
    await pool.query('DELETE FROM ship_compliance');
    await pool.query('DELETE FROM bank_entries');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /compliance/cb', () => {
    it('should compute CB for valid parameters', async () => {
      const response = await request(app)
        .get('/compliance/cb')
        .query({
          shipId: 'SHIP001',
          year: 2024,
          ghgIntensity: 88.0,
          fuelConsumption: 4800
        })
        .expect(200);

      expect(response.body).toHaveProperty('cbBefore');
      expect(response.body).toHaveProperty('applied');
      expect(response.body).toHaveProperty('cbAfter');

      // CB = (89.3368 - 88.0) × (4800 × 41000) = 1.3368 × 196,800,000 = 263,082,240
      expect(response.body.cbBefore).toBeCloseTo(263082240, 0);
      expect(response.body.applied).toBe(0); // No banking entries yet
      expect(response.body.cbAfter).toBeCloseTo(263082240, 0);
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/compliance/cb')
        .query({
          shipId: 'SHIP001',
          year: 2024
          // Missing ghgIntensity and fuelConsumption
        })
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_PARAMETERS');
    });

    it('should return 400 for invalid ghgIntensity', async () => {
      const response = await request(app)
        .get('/compliance/cb')
        .query({
          shipId: 'SHIP001',
          year: 2024,
          ghgIntensity: -1, // Invalid
          fuelConsumption: 4800
        })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /compliance/adjusted-cb', () => {
    it('should return adjusted CB for ship with no compliance record', async () => {
      const response = await request(app)
        .get('/compliance/adjusted-cb')
        .query({
          shipId: 'NONEXISTENT',
          year: 2024
        })
        .expect(200);

      expect(response.body.cbBefore).toBe(0);
      expect(response.body.applied).toBe(0);
      expect(response.body.cbAfter).toBe(0);
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .get('/compliance/adjusted-cb')
        .query({
          shipId: 'SHIP001'
          // Missing year
        })
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_PARAMETERS');
    });
  });
});