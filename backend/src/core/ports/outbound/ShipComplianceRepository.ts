import { ShipCompliance } from '@core/domain/entities/ShipCompliance';

export interface ShipComplianceRepository {
  save(compliance: ShipCompliance): Promise<ShipCompliance>;
  findByShipAndYear(shipId: string, year: number): Promise<ShipCompliance | null>;
}
