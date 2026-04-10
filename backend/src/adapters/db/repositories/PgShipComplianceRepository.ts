import { Pool } from 'pg';
import { ShipComplianceRepository } from '@core/ports/outbound/ShipComplianceRepository';
import { ShipCompliance } from '@core/domain/entities/ShipCompliance';

export class PgShipComplianceRepository implements ShipComplianceRepository {
  constructor(private readonly pool: Pool) {}

  async save(compliance: ShipCompliance): Promise<ShipCompliance> {
    const result = await this.pool.query(`
      INSERT INTO ship_compliance (ship_id, year, cb_gco2eq)
      VALUES ($1, $2, $3)
      RETURNING id, ship_id, year, cb_gco2eq
    `, [compliance.shipId, compliance.year, compliance.cbGco2eq]);
    
    return this.mapRowToShipCompliance(result.rows[0]);
  }

  async findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null> {
    const result = await this.pool.query(`
      SELECT id, ship_id, year, cb_gco2eq
      FROM ship_compliance 
      WHERE ship_id = $1 AND year = $2
      ORDER BY id DESC 
      LIMIT 1
    `, [shipId, year]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToShipCompliance(result.rows[0]);
  }

  private mapRowToShipCompliance(row: any): ShipCompliance {
    return {
      id: row.id,
      shipId: row.ship_id,
      year: row.year,
      cbGco2eq: parseFloat(row.cb_gco2eq),
    };
  }
}