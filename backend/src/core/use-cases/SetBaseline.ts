import { ResourceNotFoundError } from '@core/domain/errors';
import { Route } from '@core/domain/entities/Route';
import { RouteRepository } from '@core/ports/outbound/RouteRepository';

export interface SetBaselineInput {
  routeId: string;
}

export class SetBaseline {
  constructor(private readonly routeRepo: RouteRepository) {}

  async execute(input: SetBaselineInput): Promise<Route> {
    const route = await this.routeRepo.findById(input.routeId);
    if (!route) {
      throw new ResourceNotFoundError(`Route '${input.routeId}' not found`);
    }

    return this.routeRepo.setBaseline(input.routeId);
  }
}
