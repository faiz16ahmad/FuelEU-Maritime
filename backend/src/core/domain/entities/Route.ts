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
