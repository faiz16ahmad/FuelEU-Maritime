// Dependency Injection Container
// Wires up repositories and use-cases following hexagonal architecture

import { pool } from '@adapters/db/client';

// Repository implementations
import { PgRouteRepository } from '@adapters/db/repositories/PgRouteRepository';
import { PgShipComplianceRepository } from '@adapters/db/repositories/PgShipComplianceRepository';
import { PgBankingRepository } from '@adapters/db/repositories/PgBankingRepository';
import { PgPoolRepository } from '@adapters/db/repositories/PgPoolRepository';

// Use-cases
import { ComputeCB } from '@core/use-cases/ComputeCB';
import { ComputeComparison } from '@core/use-cases/ComputeComparison';
import { BankSurplus } from '@core/use-cases/BankSurplus';
import { ApplyBanked } from '@core/use-cases/ApplyBanked';
import { CreatePool } from '@core/use-cases/CreatePool';
import { GetBankingRecords } from '@core/use-cases/GetBankingRecords';
import { SetBaseline } from '@core/use-cases/SetBaseline';
import { GetAdjustedCB } from '@core/use-cases/GetAdjustedCB';

// Repository instances
export const routeRepository = new PgRouteRepository(pool);
export const shipComplianceRepository = new PgShipComplianceRepository(pool);
export const bankingRepository = new PgBankingRepository(pool);
export const poolRepository = new PgPoolRepository(pool);

// Use-case instances with dependency injection
export const computeCB = new ComputeCB(shipComplianceRepository, bankingRepository);
export const computeComparison = new ComputeComparison(routeRepository);
export const bankSurplus = new BankSurplus(bankingRepository);
export const applyBanked = new ApplyBanked(bankingRepository);
export const createPool = new CreatePool(poolRepository, shipComplianceRepository, bankingRepository);
export const getBankingRecords = new GetBankingRecords(bankingRepository);
export const setBaseline = new SetBaseline(routeRepository);
export const getAdjustedCB = new GetAdjustedCB(shipComplianceRepository, bankingRepository);