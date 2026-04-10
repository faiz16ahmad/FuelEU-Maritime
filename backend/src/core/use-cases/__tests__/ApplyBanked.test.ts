import { ApplyBanked } from '../ApplyBanked';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';
import { BankEntry } from '@core/domain/entities/BankEntry';
import { InsufficientBalanceError } from '@core/domain/errors';

class InMemoryBankingRepo implements BankingRepository {
  private entries: BankEntry[] = [];

  constructor(initialEntries: BankEntry[] = []) {
    this.entries = [...initialEntries];
  }

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

describe('ApplyBanked', () => {
  it('valid amount (100 of 500 banked) → remainingBalance = 400', async () => {
    const repo = new InMemoryBankingRepo([
      { shipId: 'S1', year: 2025, amountGco2eq: 500 },
    ]);
    const useCase = new ApplyBanked(repo);

    const result = await useCase.execute({ shipId: 'S1', year: 2025, amount: 100 });

    expect(result.remainingBalance).toBe(400);
  });

  it('boundary: amount = totalBanked → remainingBalance = 0', async () => {
    const repo = new InMemoryBankingRepo([
      { shipId: 'S1', year: 2025, amountGco2eq: 300 },
    ]);
    const useCase = new ApplyBanked(repo);

    const result = await useCase.execute({ shipId: 'S1', year: 2025, amount: 300 });

    expect(result.remainingBalance).toBe(0);
  });

  it('over-apply → throws InsufficientBalanceError', async () => {
    const repo = new InMemoryBankingRepo([
      { shipId: 'S1', year: 2025, amountGco2eq: 200 },
    ]);
    const useCase = new ApplyBanked(repo);

    await expect(
      useCase.execute({ shipId: 'S1', year: 2025, amount: 300 }),
    ).rejects.toThrow(InsufficientBalanceError);
  });

  it('no prior entries (totalBanked=0) → throws InsufficientBalanceError', async () => {
    const repo = new InMemoryBankingRepo([]);
    const useCase = new ApplyBanked(repo);

    await expect(
      useCase.execute({ shipId: 'S1', year: 2025, amount: 100 }),
    ).rejects.toThrow(InsufficientBalanceError);
  });
});
