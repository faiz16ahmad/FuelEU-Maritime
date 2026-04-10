import { TARGET_INTENSITY } from '@core/domain/constants';
import { ResourceNotFoundError } from '@core/domain/errors';
import { Route } from '@core/domain/entities/Route';
import { RouteRepository } from '@core/ports/outbound/RouteRepository';

export interface ComparisonResult {
  route: Route;
  percentDiff: number;
  compliant: boolean;
}

export interface ComputeComparisonOutput {
  baseline: Route;
  comparisons: ComparisonResult[];
}

export class ComputeComparison {
  constructor(private readonly routeRepo: RouteRepository) {}

  async execute(): Promise<ComputeComparisonOutput> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) {
      throw new ResourceNotFoundError('No baseline route is set');
    }

    const nonBaselineRoutes = await this.routeRepo.findAllNonBaseline();

    const comparisons: ComparisonResult[] = nonBaselineRoutes.map(route => ({
      route,
      percentDiff: ((route.ghgIntensity / baseline.ghgIntensity) - 1) * 100,
      compliant: route.ghgIntensity <= TARGET_INTENSITY,
    }));

    return { baseline, comparisons };
  }
}
