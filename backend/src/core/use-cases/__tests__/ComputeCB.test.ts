import { ComputeCB } from '../ComputeCB';
import { ShipComplianceRepository } from '@core/ports/outbound/ShipComplianceRepository';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';
import { ShipCompliance } from '@core/domain/entities/ShipCompliance';
import { BankEntry } from '@core/domain/entities/BankEntry';
import { InvalidInputError } from '@core/domain/errors';

// In-memory stubs
class InMemoryShipComplianceRepo implements ShipComplianceRepository {
  private records: ShipCompliance[] = [];

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
  private entries: BankEntry[] = [];

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

describe('ComputeCB', () => {
  let complianceRepo: InMemoryShipComplianceRepo;
  let bankingRepo: InMemoryBankingRepo;
  let useCase: ComputeCB;

  beforeEach(() => {
    complianceRepo = new InMemoryShipComplianceRepo();
    bankingRepo = new InMemoryBankingRepo();
    useCase = new ComputeCB(complianceRepo, bankingRepo);
  });

  it('R002: LNG route produces correct surplus CB', async () => {
    // ghgIntensity=88.0, fuelConsumption=4800
    // energyInScope = 4800 × 41000 = 196,800,000 MJ
    // cb = (89.3368 - 88.0) × 196,800,000 = 1.3368 × 196,800,000 = 263,082,240
    const result = await useCase.execute({
      shipId: 'R002',
      year: 2025,
      ghgIntensity: 88.0,
      fuelConsumption: 4800,
    });

    expect(result.cbBefore).toBeCloseTo(263_082_240, 0);
    expect(result.applied).toBe(0);
    expect(result.cbAfter).toBeCloseTo(263_082_240, 0);
  });

  it('ghgIntensity = TARGET_INTENSITY → CB = 0 (exactly compliant)', async () => {
    const result = await useCase.execute({
      shipId: 'S1',
      year: 2025,
      ghgIntensity: 89.3368,
      fuelConsumption: 5000,
    });

    expect(result.cbBefore).toBeCloseTo(0, 4);
  });

  it('R001: ghgIntensity > TARGET → negative CB (deficit)', async () => {
    // ghgIntensity=91.0, fuelConsumption=5000
    // energyInScope = 5000 × 41000 = 205,000,000 MJ
    // cb = (89.3368 - 91.0) × 205,000,000 = -1.6632 × 205,000,000 = -340,956,000
    const result = await useCase.execute({
      shipId: 'R001',
      year: 2025,
      ghgIntensity: 91.0,
      fuelConsumption: 5000,
    });

    expect(result.cbBefore).toBeCloseTo(-340_956_000, 0);
  });

  it('fuelConsumption = 0 → throws InvalidInputError', async () => {
    await expect(
      useCase.execute({ shipId: 'S1', year: 2025, ghgIntensity: 88.0, fuelConsumption: 0 }),
    ).rejects.toThrow(InvalidInputError);
  });

  it('ghgIntensity = -1 → throws InvalidInputError', async () => {
    await expect(
      useCase.execute({ shipId: 'S1', year: 2025, ghgIntensity: -1, fuelConsumption: 5000 }),
    ).rejects.toThrow(InvalidInputError);
  });
});
