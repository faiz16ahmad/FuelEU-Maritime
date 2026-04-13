// API response types matching backend entities

export interface Route {
  id: number;
  routeId: string;
  year: number;
  ghgIntensity: number;
  isBaseline: boolean;
  vesselType: string;
  fuelType: string;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
}

export interface ComparisonResult {
  baseline: Route;
  comparisons: Array<{
    route: Route;
    percentDiff: number;
    compliant: boolean;
  }>;
}

export interface ComplianceBalance {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

export interface BankEntry {
  id?: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export interface PoolResult {
  poolId: number;
  year: number;
  members: Array<{
    shipId: string;
    cbBefore: number;
    cbAfter: number;
  }>;
}