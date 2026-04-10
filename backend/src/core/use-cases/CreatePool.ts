import { InvalidInputError, InvalidPoolError } from '@core/domain/errors';
import { PoolMember } from '@core/domain/entities/PoolMember';
import { ShipComplianceRepository } from '@core/ports/outbound/ShipComplianceRepository';
import { BankingRepository } from '@core/ports/outbound/BankingRepository';
import { PoolRepository } from '@core/ports/outbound/PoolRepository';

export interface CreatePoolInput {
  shipIds: string[];
  year: number;
}

export interface CreatePoolOutput {
  poolId: number | undefined;
  year: number;
  members: PoolMember[];
}

export class CreatePool {
  constructor(
    private readonly complianceRepo: ShipComplianceRepository,
    private readonly bankingRepo: BankingRepository,
    private readonly poolRepo: PoolRepository,
  ) {}

  async execute(input: CreatePoolInput): Promise<CreatePoolOutput> {
    if (input.shipIds.length < 2) {
      throw new InvalidInputError('A pool requires at least two members');
    }

    // Fetch adjusted CB for each ship
    const members: PoolMember[] = await Promise.all(
      input.shipIds.map(async shipId => {
        const compliance = await this.complianceRepo.findByShipAndYear(shipId, input.year);
        const cbGco2eq = compliance ? compliance.cbGco2eq : 0;
        const totalBanked = await this.bankingRepo.getTotalBanked(shipId, input.year);
        const adjustedCB = cbGco2eq + totalBanked;
        return { shipId, cbBefore: adjustedCB, cbAfter: adjustedCB };
      }),
    );

    // Validate total CB >= 0
    const totalCB = members.reduce((sum, m) => sum + m.cbBefore, 0);
    if (totalCB < 0) {
      throw new InvalidPoolError(
        'Pool cannot be formed: total deficit exceeds total surplus',
      );
    }

    // Greedy allocation
    // Sort descending by cbAfter
    members.sort((a, b) => b.cbAfter - a.cbAfter);

    for (let i = members.length - 1; i >= 0; i--) {
      const deficit = members[i];
      if (deficit.cbAfter >= 0) break; // no more deficits

      for (let j = 0; j < i; j++) {
        const surplus = members[j];
        if (surplus.cbAfter <= 0) continue;

        const transfer = Math.min(surplus.cbAfter, Math.abs(deficit.cbAfter));
        surplus.cbAfter -= transfer;
        deficit.cbAfter += transfer;

        if (deficit.cbAfter >= 0) break;
      }
    }

    const pool = await this.poolRepo.save({
      year: input.year,
      members,
    });

    return {
      poolId: pool.id,
      year: pool.year,
      members: pool.members,
    };
  }
}
