import { Pool } from 'pg';
import { RouteRepository } from '@core/ports/outbound/RouteRepository';
import { Route } from '@core/domain/entities/Route';
import { ResourceNotFoundError } from '@core/domain/errors';

export class PgRouteRepository implements RouteRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Route[]> {
    const result = await this.pool.query(`
      SELECT id, route_id, year, ghg_intensity, is_baseline, 
             vessel_type, fuel_type, fuel_consumption, distance, total_emissions
      FROM routes 
      ORDER BY year DESC, route_id ASC
    `);
    
    return result.rows.map(this.mapRowToRoute);
  }

  async findById(routeId: string): Promise<Route | null> {
    const result = await this.pool.query(`
      SELECT id, route_id, year, ghg_intensity, is_baseline, 
             vessel_type, fuel_type, fuel_consumption, distance, total_emissions
      FROM routes 
      WHERE route_id = $1
    `, [routeId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToRoute(result.rows[0]);
  }

  async findBaseline(): Promise<Route | null> {
    const result = await this.pool.query(`
      SELECT id, route_id, year, ghg_intensity, is_baseline, 
             vessel_type, fuel_type, fuel_consumption, distance, total_emissions
      FROM routes 
      WHERE is_baseline = true 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToRoute(result.rows[0]);
  }

  async setBaseline(routeId: string): Promise<Route> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // First verify the route exists
      const routeCheck = await client.query(
        'SELECT id FROM routes WHERE route_id = $1',
        [routeId]
      );
      
      if (routeCheck.rows.length === 0) {
        throw new ResourceNotFoundError(`Route ${routeId} not found`);
      }
      
      // Set all routes to non-baseline
      await client.query('UPDATE routes SET is_baseline = false');
      
      // Set the target route as baseline
      const result = await client.query(`
        UPDATE routes 
        SET is_baseline = true 
        WHERE route_id = $1
        RETURNING id, route_id, year, ghg_intensity, is_baseline, 
                  vessel_type, fuel_type, fuel_consumption, distance, total_emissions
      `, [routeId]);
      
      await client.query('COMMIT');
      
      return this.mapRowToRoute(result.rows[0]);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findAllNonBaseline(): Promise<Route[]> {
    const result = await this.pool.query(`
      SELECT id, route_id, year, ghg_intensity, is_baseline, 
             vessel_type, fuel_type, fuel_consumption, distance, total_emissions
      FROM routes 
      WHERE is_baseline = false
      ORDER BY year DESC, route_id ASC
    `);
    
    return result.rows.map(this.mapRowToRoute);
  }

  private mapRowToRoute(row: any): Route {
    return {
      id: row.id,
      routeId: row.route_id,
      year: row.year,
      ghgIntensity: parseFloat(row.ghg_intensity),
      isBaseline: row.is_baseline,
      vesselType: row.vessel_type,
      fuelType: row.fuel_type,
      fuelConsumption: parseFloat(row.fuel_consumption),
      distance: parseFloat(row.distance),
      totalEmissions: parseFloat(row.total_emissions),
    };
  }
}