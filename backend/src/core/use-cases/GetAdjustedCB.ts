import { ShipComplianceRepository } from '@core/ports/outbound/ShipComplianceRepository';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';

export interface GetAdjustedCBInput {
  shipId: string;
  year: number;
}

export interface GetAdjustedCBOutput {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

export class GetAdjustedCB {
  constructor(
    private readonly complianceRepo: ShipComplianceRepository,
    private readonly bankingRepo: BankingRepository,
  ) {}

  async execute(input: GetAdjustedCBInput): Promise<GetAdjustedCBOutput> {
    const compliance = await this.complianceRepo.findByShipAndYear(input.shipId, input.year);

    if (!compliance) {
      return { cbBefore: 0, applied: 0, cbAfter: 0 };
    }

    const applied = await this.bankingRepo.getTotalBanked(input.shipId, input.year);

    return {
      cbBefore: compliance.cbGco2eq,
      applied,
      cbAfter: compliance.cbGco2eq + applied,
    };
  }
}
