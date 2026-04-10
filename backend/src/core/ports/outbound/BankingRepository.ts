import { BankEntry } from '@core/domain/entities/BankEntry';

export interface BankingRepository {
  save(entry: BankEntry): Promise<BankEntry>;
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
}
