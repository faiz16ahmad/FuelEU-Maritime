import { InsufficientBalanceError } from '@core/domain/errors';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';

export interface ApplyBankedInput {
  shipId: string;
  year: number;
  amount: number;
}

export interface ApplyBankedOutput {
  remainingBalance: number;
}

export class ApplyBanked {
  constructor(private readonly bankingRepo: BankingRepository) {}

  async execute(input: ApplyBankedInput): Promise<ApplyBankedOutput> {
    const totalBanked = await this.bankingRepo.getTotalBanked(input.shipId, input.year);

    if (input.amount > totalBanked) {
      throw new InsufficientBalanceError(
        `Insufficient banked balance: requested ${input.amount}, available ${totalBanked}`,
      );
    }

    await this.bankingRepo.save({
      shipId: input.shipId,
      year: input.year,
      amountGco2eq: -input.amount,
    });

    return { remainingBalance: totalBanked - input.amount };
  }
}
