import { Pool } from '@core/domain/entities/Pool';

export interface PoolRepository {
  save(pool: Pool): Promise<Pool>;
  findById(poolId: number): Promise<Pool | null>;
}
