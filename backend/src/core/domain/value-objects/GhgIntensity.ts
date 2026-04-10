import { InvalidInputError } from '../errors';

export type GhgIntensity = number & { readonly _brand: 'GhgIntensity' };

export function createGhgIntensity(value: number): GhgIntensity {
  if (value <= 0) {
    throw new InvalidInputError('GHG intensity must be positive');
  }
  return value as GhgIntensity;
}
