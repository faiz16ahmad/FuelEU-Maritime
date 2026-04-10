import { Route } from '@core/domain/entities/Route';

export interface RouteRepository {
  findAll(): Promise<Route[]>;
  findById(routeId: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  setBaseline(routeId: string): Promise<Route>;
  findAllNonBaseline(): Promise<Route[]>;
}
