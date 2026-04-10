import { InsufficientBalanceError } from '@core/domain/errors';
import { BankEntry } from '@core/domain/entities/BankEntry';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';

export interface BankSurplusInput {
  shipId: string;
  year: number;
  cb: number;
}

export class BankSurplus {
  constructor(private readonly bankingRepo: BankingRepository) {}

  async execute(input: BankSurplusInput): Promise<BankEntry> {
    if (input.cb <= 0) {
      throw new InsufficientBalanceError('No surplus to bank');
    }

    const entry: BankEntry = {
      shipId: input.shipId,
      year: input.year,
      amountGco2eq: input.cb,
    };

    return this.bankingRepo.save(entry);
  }
}
