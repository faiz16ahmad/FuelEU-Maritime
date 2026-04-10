import { Pool as PgPool } from 'pg';
import { PoolRepository } from '@core/ports/outbound/PoolRepository';
import { Pool } from '@core/domain/entities/Pool';
import { PoolMember } from '@core/domain/entities/PoolMember';

export class PgPoolRepository implements PoolRepository {
  constructor(private readonly pool: PgPool) {}

  async save(poolEntity: Pool): Promise<Pool> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert pool
      const poolResult = await client.query(`
        INSERT INTO pools (year)
        VALUES ($1)
        RETURNING id, year, created_at
      `, [poolEntity.year]);
      
      const savedPool = poolResult.rows[0];
      const poolId = savedPool.id;
      
      // Insert pool members
      const savedMembers: PoolMember[] = [];
      for (const member of poolEntity.members) {
        await client.query(`
          INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after)
          VALUES ($1, $2, $3, $4)
        `, [poolId, member.shipId, member.cbBefore, member.cbAfter]);
        
        savedMembers.push({
          poolId,
          shipId: member.shipId,
          cbBefore: member.cbBefore,
          cbAfter: member.cbAfter,
        });
      }
      
      await client.query('COMMIT');
      
      return {
        id: poolId,
        year: savedPool.year,
        createdAt: savedPool.created_at,
        members: savedMembers,
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(poolId: number): Promise<Pool | null> {
    const poolResult = await this.pool.query(`
      SELECT id, year, created_at
      FROM pools 
      WHERE id = $1
    `, [poolId]);
    
    if (poolResult.rows.length === 0) {
      return null;
    }
    
    const poolRow = poolResult.rows[0];
    
    // Get pool members
    const membersResult = await this.pool.query(`
      SELECT pool_id, ship_id, cb_before, cb_after
      FROM pool_members 
      WHERE pool_id = $1
      ORDER BY ship_id
    `, [poolId]);
    
    const members: PoolMember[] = membersResult.rows.map(row => ({
      poolId: row.pool_id,
      shipId: row.ship_id,
      cbBefore: parseFloat(row.cb_before),
      cbAfter: parseFloat(row.cb_after),
    }));
    
    return {
      id: poolRow.id,
      year: poolRow.year,
      createdAt: poolRow.created_at,
      members,
    };
  }
}