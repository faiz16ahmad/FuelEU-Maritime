import { TARGET_INTENSITY, LCV_MJ_PER_TONNE } from '@core/domain/constants';
import { InvalidInputError } from '@core/domain/errors';
import { ShipComplianceRepository } from '@core/ports/outbound/ShipComplianceRepository';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';

export interface ComputeCBInput {
  shipId: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
}

export interface ComputeCBOutput {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

export class ComputeCB {
  constructor(
    private readonly complianceRepo: ShipComplianceRepository,
    private readonly bankingRepo: BankingRepository,
  ) {}

  async execute(input: ComputeCBInput): Promise<ComputeCBOutput> {
    if (input.ghgIntensity <= 0) throw new InvalidInputError('GHG intensity must be positive');
    if (input.fuelConsumption <= 0) throw new InvalidInputError('Fuel consumption must be positive');

    const energyInScope = input.fuelConsumption * LCV_MJ_PER_TONNE;
    const cbBefore = (TARGET_INTENSITY - input.ghgIntensity) * energyInScope;

    await this.complianceRepo.save({ shipId: input.shipId, year: input.year, cbGco2eq: cbBefore });

    const applied = await this.bankingRepo.getTotalBanked(input.shipId, input.year);
    const cbAfter = cbBefore + applied;

    return { cbBefore, applied, cbAfter };
  }
}
