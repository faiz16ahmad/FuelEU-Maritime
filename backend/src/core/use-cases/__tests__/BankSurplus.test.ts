import { BankSurplus } from '../BankSurplus';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';
import { BankEntry } from '@core/domain/entities/BankEntry';
import { InsufficientBalanceError } from '@core/domain/errors';

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

describe('BankSurplus', () => {
  let bankingRepo: InMemoryBankingRepo;
  let useCase: BankSurplus;

  beforeEach(() => {
    bankingRepo = new InMemoryBankingRepo();
    useCase = new BankSurplus(bankingRepo);
  });

  it('positive CB creates a BankEntry with correct amountGco2eq', async () => {
    const result = await useCase.execute({ shipId: 'S1', year: 2025, cb: 500 });

    expect(result.shipId).toBe('S1');
    expect(result.year).toBe(2025);
    expect(result.amountGco2eq).toBe(500);
    expect(result.id).toBeDefined();
  });

  it('CB = 0 → throws InsufficientBalanceError', async () => {
    await expect(
      useCase.execute({ shipId: 'S1', year: 2025, cb: 0 }),
    ).rejects.toThrow(InsufficientBalanceError);
  });

  it('CB = -100 → throws InsufficientBalanceError', async () => {
    await expect(
      useCase.execute({ shipId: 'S1', year: 2025, cb: -100 }),
    ).rejects.toThrow(InsufficientBalanceError);
  });
});
