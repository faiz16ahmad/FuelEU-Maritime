import { Pool } from 'pg';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';
import { BankEntry } from '@core/domain/entities/BankEntry';

export class PgBankingRepository implements BankingRepository {
  constructor(private readonly pool: Pool) {}

  async save(entry: BankEntry): Promise<BankEntry> {
    const result = await this.pool.query(`
      INSERT INTO bank_entries (ship_id, year, amount_gco2eq)
      VALUES ($1, $2, $3)
      RETURNING id, ship_id, year, amount_gco2eq
    `, [entry.shipId, entry.year, entry.amountGco2eq]);
    
    return this.mapRowToBankEntry(result.rows[0]);
  }

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const result = await this.pool.query(`
      SELECT id, ship_id, year, amount_gco2eq
      FROM bank_entries 
      WHERE ship_id = $1 AND year = $2
      ORDER BY created_at ASC
    `, [shipId, year]);
    
    return result.rows.map(this.mapRowToBankEntry);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const result = await this.pool.query(`
      SELECT COALESCE(SUM(amount_gco2eq), 0) as total
      FROM bank_entries 
      WHERE ship_id = $1 AND year = $2
    `, [shipId, year]);
    
    return parseFloat(result.rows[0].total);
  }

  private mapRowToBankEntry(row: any): BankEntry {
    return {
      id: row.id,
      shipId: row.ship_id,
      year: row.year,
      amountGco2eq: parseFloat(row.amount_gco2eq),
    };
  }
}