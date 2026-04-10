import { pool } from '../client';
import { runMigrations } from '../migrate';
import { PgBankingRepository } from '../repositories/PgBankingRepository';

describe('PgBankingRepository Integration Tests', () => {
  let repository: PgBankingRepository;

  beforeAll(async () => {
    await runMigrations();
    repository = new PgBankingRepository(pool);
  });

  beforeEach(async () => {
    // Clean bank_entries table before each test
    await pool.query('DELETE FROM bank_entries');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('save', () => {
    it('should save a bank entry and return it with id', async () => {
      const entry = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 1000.5,
      };

      const saved = await repository.save(entry);
      
      expect(saved.id).toBeDefined();
      expect(saved.shipId).toBe(entry.shipId);
      expect(saved.year).toBe(entry.year);
      expect(saved.amountGco2eq).toBe(entry.amountGco2eq);
    });
  });

  describe('findByShipAndYear', () => {
    it('should return all entries for a ship and year', async () => {
      const shipId = 'SHIP001';
      const year = 2024;

      // Save multiple entries
      await repository.save({ shipId, year, amountGco2eq: 500 });
      await repository.save({ shipId, year, amountGco2eq: -200 });
      await repository.save({ shipId, year, amountGco2eq: 300 });

      const entries = await repository.findByShipAndYear(shipId, year);
      
      expect(entries).toHaveLength(3);
      expect(entries.map(e => e.amountGco2eq)).toEqual([500, -200, 300]);
    });

    it('should return empty array for non-existent ship/year', async () => {
      const entries = await repository.findByShipAndYear('NONEXISTENT', 2024);
      expect(entries).toHaveLength(0);
    });
  });

  describe('getTotalBanked', () => {
    it('should return sum of all entries for ship and year', async () => {
      const shipId = 'SHIP001';
      const year = 2024;

      await repository.save({ shipId, year, amountGco2eq: 1000 });
      await repository.save({ shipId, year, amountGco2eq: -300 });
      await repository.save({ shipId, year, amountGco2eq: 500 });

      const total = await repository.getTotalBanked(shipId, year);
      expect(total).toBe(1200); // 1000 - 300 + 500
    });

    it('should return 0 for ship with no entries', async () => {
      const total = await repository.getTotalBanked('NONEXISTENT', 2024);
      expect(total).toBe(0);
    });

    it('should handle negative total (deficit scenario)', async () => {
      const shipId = 'SHIP002';
      const year = 2024;

      await repository.save({ shipId, year, amountGco2eq: 500 });
      await repository.save({ shipId, year, amountGco2eq: -800 });

      const total = await repository.getTotalBanked(shipId, year);
      expect(total).toBe(-300); // 500 - 800
    });
  });

  describe('banking ledger integrity', () => {
    it('should maintain accurate running balance through multiple operations', async () => {
      const shipId = 'SHIP003';
      const year = 2024;

      // Initial banking of surplus
      await repository.save({ shipId, year, amountGco2eq: 1500 });
      expect(await repository.getTotalBanked(shipId, year)).toBe(1500);

      // Apply some banked amount
      await repository.save({ shipId, year, amountGco2eq: -400 });
      expect(await repository.getTotalBanked(shipId, year)).toBe(1100);

      // Bank more surplus
      await repository.save({ shipId, year, amountGco2eq: 600 });
      expect(await repository.getTotalBanked(shipId, year)).toBe(1700);

      // Apply more banked amount
      await repository.save({ shipId, year, amountGco2eq: -200 });
      expect(await repository.getTotalBanked(shipId, year)).toBe(1500);

      // Verify all entries are tracked
      const allEntries = await repository.findByShipAndYear(shipId, year);
      expect(allEntries).toHaveLength(4);
      expect(allEntries.map(e => e.amountGco2eq)).toEqual([1500, -400, 600, -200]);
    });

    it('should allow ledger to go negative (business rule enforcement is in use-case layer)', async () => {
      const shipId = 'SHIP004';
      const year = 2024;

      // Bank some surplus
      await repository.save({ shipId, year, amountGco2eq: 300 });
      
      // Over-apply (this should be prevented by use-case layer, but repository allows it)
      await repository.save({ shipId, year, amountGco2eq: -500 });
      
      const total = await repository.getTotalBanked(shipId, year);
      expect(total).toBe(-200); // Repository allows negative, use-case should prevent this
    });
  });
});