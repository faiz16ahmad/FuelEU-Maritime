import { InvalidInputError } from '../errors';

export type FuelConsumption = number & { readonly _brand: 'FuelConsumption' };

export function createFuelConsumption(value: number): FuelConsumption {
  if (value <= 0) {
    throw new InvalidInputError('Fuel consumption must be positive');
  }
  return value as FuelConsumption;
}
