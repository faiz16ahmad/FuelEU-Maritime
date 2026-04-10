import { CreatePool } from '../CreatePool';
import { ShipComplianceRepository } from '@core/ports/outbound/ShipComplianceRepository';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';
import { PoolRepository } from '@core/ports/outbound/PoolRepository';
import { ShipCompliance } from '@core/domain/entities/ShipCompliance';
import { BankEntry } from '@core/domain/entities/BankEntry';
import { Pool } from '@core/domain/entities/Pool';
import { InvalidInputError, InvalidPoolError } from '@core/domain/errors';

class InMemoryShipComplianceRepo implements ShipComplianceRepository {
  constructor(private records: ShipCompliance[] = []) {}

  async save(compliance: ShipCompliance): Promise<ShipCompliance> {
    const saved = { ...compliance, id: this.records.length + 1 };
    this.records.push(saved);
    return saved;
  }

  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    return this.records.find(r => r.shipId === shipId && r.year === year) ?? null;
  }
}

class InMemoryBankingRepo implements BankingRepository {
  constructor(private entries: BankEntry[] = []) {}

  async save(entry: BankEntry): Promise<BankEntry> {
    const saved = { ...entry, id: this.entries.length + 1 };
    this.entries.push(saved);
    return saved;
  }

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    return this.entries.filter(e => e.shipId === shipId && e.year === year);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const entries = await this.findByShipAndYear(shipId, year);
    return entries.reduce((sum, e) => sum + e.amountGco2eq, 0);
  }
}

class InMemoryPoolRepo implements PoolRepository {
  private pools: Pool[] = [];

  async save(pool: Pool): Promise<Pool> {
    const saved = { ...pool, id: this.pools.length + 1 };
    this.pools.push(saved);
    return saved;
  }

  async findById(poolId: number): Promise<Pool | null> {
    return this.pools.find(p => p.id === poolId) ?? null;
  }
}

function makeUseCase(
  complianceRecords: ShipCompliance[],
  bankEntries: BankEntry[] = [],
): CreatePool {
  return new CreatePool(
    new InMemoryShipComplianceRepo(complianceRecords),
    new InMemoryBankingRepo(bankEntries),
    new InMemoryPoolRepo(),
  );
}

describe('CreatePool', () => {
  it('two ships: S1 cbBefore=+500, S2 cbBefore=-300 → S1 cbAfter=+200, S2 cbAfter=0', async () => {
    const useCase = makeUseCase([
      { shipId: 'S1', year: 2025, cbGco2eq: 500 },
      { shipId: 'S2', year: 2025, cbGco2eq: -300 },
    ]);

    const result = await useCase.execute({ shipIds: ['S1', 'S2'], year: 2025 });

    const s1 = result.members.find(m => m.shipId === 'S1')!;
    const s2 = result.members.find(m => m.shipId === 'S2')!;

    expect(s1.cbAfter).toBe(200);
    expect(s2.cbAfter).toBe(0);
  });

  it('three ships: S1=+1000, S2=-400, S3=-200 → S1=+400, S2=0, S3=0', async () => {
    const useCase = makeUseCase([
      { shipId: 'S1', year: 2025, cbGco2eq: 1000 },
      { shipId: 'S2', year: 2025, cbGco2eq: -400 },
      { shipId: 'S3', year: 2025, cbGco2eq: -200 },
    ]);

    const result = await useCase.execute({ shipIds: ['S1', 'S2', 'S3'], year: 2025 });

    const s1 = result.members.find(m => m.shipId === 'S1')!;
    const s2 = result.members.find(m => m.shipId === 'S2')!;
    const s3 = result.members.find(m => m.shipId === 'S3')!;

    expect(s1.cbAfter).toBe(400);
    expect(s2.cbAfter).toBe(0);
    expect(s3.cbAfter).toBe(0);
  });

  it('total negative: S1=-100, S2=-200 → throws InvalidPoolError', async () => {
    const useCase = makeUseCase([
      { shipId: 'S1', year: 2025, cbGco2eq: -100 },
      { shipId: 'S2', year: 2025, cbGco2eq: -200 },
    ]);

    await expect(
      useCase.execute({ shipIds: ['S1', 'S2'], year: 2025 }),
    ).rejects.toThrow(InvalidPoolError);
  });

  it('single ship → throws InvalidInputError', async () => {
    const useCase = makeUseCase([
      { shipId: 'S1', year: 2025, cbGco2eq: 500 },
    ]);

    await expect(
      useCase.execute({ shipIds: ['S1'], year: 2025 }),
    ).rejects.toThrow(InvalidInputError);
  });

  it('all surplus: no redistribution, cbAfter = cbBefore', async () => {
    const useCase = makeUseCase([
      { shipId: 'S1', year: 2025, cbGco2eq: 300 },
      { shipId: 'S2', year: 2025, cbGco2eq: 200 },
    ]);

    const result = await useCase.execute({ shipIds: ['S1', 'S2'], year: 2025 });

    for (const member of result.members) {
      expect(member.cbAfter).toBe(member.cbBefore);
    }
  });

  it('deficit ship cannot exit worse than cbBefore', async () => {
    const useCase = makeUseCase([
      { shipId: 'S1', year: 2025, cbGco2eq: 500 },
      { shipId: 'S2', year: 2025, cbGco2eq: -300 },
    ]);

    const result = await useCase.execute({ shipIds: ['S1', 'S2'], year: 2025 });

    const s2 = result.members.find(m => m.shipId === 'S2')!;
    expect(s2.cbAfter).toBeGreaterThanOrEqual(s2.cbBefore);
  });

  it('surplus ship cannot exit with negative CB', async () => {
    const useCase = makeUseCase([
      { shipId: 'S1', year: 2025, cbGco2eq: 500 },
      { shipId: 'S2', year: 2025, cbGco2eq: -300 },
    ]);

    const result = await useCase.execute({ shipIds: ['S1', 'S2'], year: 2025 });

    for (const member of result.members) {
      if (member.cbBefore > 0) {
        expect(member.cbAfter).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
