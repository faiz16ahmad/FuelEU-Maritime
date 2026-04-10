import { LCV_MJ_PER_TONNE } from '../constants';

export class EnergyInScope {
  private constructor(readonly value: number) {}

  static compute(fuelConsumption: number): EnergyInScope {
    return new EnergyInScope(fuelConsumption * LCV_MJ_PER_TONNE);
  }
}
