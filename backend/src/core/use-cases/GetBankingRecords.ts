import { BankEntry } from '@core/domain/entities/BankEntry';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';

export interface GetBankingRecordsInput {
  shipId: string;
  year: number;
}

export class GetBankingRecords {
  constructor(private readonly bankingRepo: BankingRepository) {}

  async execute(input: GetBankingRecordsInput): Promise<BankEntry[]> {
    return this.bankingRepo.findByShipAndYear(input.shipId, input.year);
  }
}
