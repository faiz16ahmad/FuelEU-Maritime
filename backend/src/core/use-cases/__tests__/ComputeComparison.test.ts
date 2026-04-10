import { ComputeComparison } from '../ComputeComparison';
import { RouteRepository } from '@core/ports/outbound/RouteRepository';
import { Route } from '@core/domain/entities/Route';
import { ResourceNotFoundError } from '@core/domain/errors';

function makeRoute(overrides: Partial<Route>): Route {
  return {
    id: 1,
    routeId: 'R001',
    year: 2025,
    ghgIntensity: 91.0,
    isBaseline: false,
    vesselType: 'Tanker',
    fuelType: 'HFO',
    fuelConsumption: 5000,
    distance: 1000,
    totalEmissions: 455000,
    ...overrides,
  };
}

class InMemoryRouteRepo implements RouteRepository {
  constructor(
    private baseline: Route | null,
    private nonBaseline: Route[],
  ) {}

  async findAll(): Promise<Route[]> {
    return this.baseline ? [this.baseline, ...this.nonBaseline] : [...this.nonBaseline];
  }

  async findById(routeId: string): Promise<Route | null> {
    const all = await this.findAll();
    return all.find(r => r.routeId === routeId) ?? null;
  }

  async findBaseline(): Promise<Route | null> {
    return this.baseline;
  }

  async setBaseline(routeId: string): Promise<Route> {
    const route = await this.findById(routeId);
    if (!route) throw new Error('Not found');
    this.baseline = { ...route, isBaseline: true };
    return this.baseline;
  }

  async findAllNonBaseline(): Promise<Route[]> {
    return this.nonBaseline;
  }
}

describe('ComputeComparison', () => {
  it('computes percentDiff correctly: baseline=91.0, comparison=88.0', async () => {
    const baseline = makeRoute({ routeId: 'R001', ghgIntensity: 91.0, isBaseline: true });
    const comparison = makeRoute({ routeId: 'R002', ghgIntensity: 88.0, isBaseline: false });
    const repo = new InMemoryRouteRepo(baseline, [comparison]);
    const useCase = new ComputeComparison(repo);

    const result = await useCase.execute();

    // percentDiff = ((88/91) - 1) * 100 = -3.2967...%
    expect(result.comparisons[0].percentDiff).toBeCloseTo(-3.2967, 3);
  });

  it('compliant = true when ghgIntensity = 88.0 (≤ 89.3368)', async () => {
    const baseline = makeRoute({ routeId: 'R001', ghgIntensity: 91.0, isBaseline: true });
    const comparison = makeRoute({ routeId: 'R002', ghgIntensity: 88.0, isBaseline: false });
    const repo = new InMemoryRouteRepo(baseline, [comparison]);
    const useCase = new ComputeComparison(repo);

    const result = await useCase.execute();

    expect(result.comparisons[0].compliant).toBe(true);
  });

  it('compliant = false when ghgIntensity = 93.5 (> 89.3368)', async () => {
    const baseline = makeRoute({ routeId: 'R001', ghgIntensity: 91.0, isBaseline: true });
    const comparison = makeRoute({ routeId: 'R003', ghgIntensity: 93.5, isBaseline: false });
    const repo = new InMemoryRouteRepo(baseline, [comparison]);
    const useCase = new ComputeComparison(repo);

    const result = await useCase.execute();

    expect(result.comparisons[0].compliant).toBe(false);
  });

  it('throws ResourceNotFoundError when no baseline exists', async () => {
    const repo = new InMemoryRouteRepo(null, []);
    const useCase = new ComputeComparison(repo);

    await expect(useCase.execute()).rejects.toThrow(ResourceNotFoundError);
  });
});
