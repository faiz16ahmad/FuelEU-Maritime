# Tasks

## Phase 1 — Core / Domain Logic

### 1.1 Project Scaffolding & Monorepo Structure
- [x] 1.1.1 Initialise root workspace with `package.json` (workspaces: backend, frontend)
- [x] 1.1.2 Create `backend/` directory with `package.json`, `tsconfig.json` (strict mode, path aliases for `@core`, `@adapters`)
- [x] 1.1.3 Create `frontend/` directory with Vite + React + TypeScript template and TailwindCSS
- [x] 1.1.4 Add `.gitignore`, `.env.example` files at root and in `backend/`
- [x] 1.1.5 Install backend dev dependencies: TypeScript, ts-node, nodemon, Jest, ts-jest, Supertest, @types/*

### 1.2 Domain Value Objects
- [x] 1.2.1 Create `backend/src/core/domain/value-objects/GhgIntensity.ts` — branded number type, validates > 0, throws `DomainError` on invalid
- [x] 1.2.2 Create `backend/src/core/domain/value-objects/FuelConsumption.ts` — branded number type, validates > 0, throws `DomainError` on invalid
- [x] 1.2.3 Create `backend/src/core/domain/value-objects/ComplianceBalance.ts` — branded number type, exposes `isSurplus()`, `isDeficit()`, `isCompliant()` helpers
- [x] 1.2.4 Create `backend/src/core/domain/value-objects/EnergyInScope.ts` — computed from FuelConsumption × LCV constant
- [ ] 1.2.5 Create `backend/src/core/domain/errors/DomainError.ts` — typed base error class with `code` and `message` fields
- [x] 1.2.6 Create `backend/src/core/domain/errors/index.ts` — re-exports all domain error subtypes (InvalidInputError, InsufficientBalanceError, InvalidPoolError, ResourceNotFoundError)

### 1.3 Domain Constants
- [x] 1.3.1 Create `backend/src/core/domain/constants.ts` — exports `TARGET_INTENSITY = 89.3368`, `LCV_MJ_PER_TONNE = 41000`

### 1.4 Domain Entities
- [x] 1.4.1 Create `backend/src/core/domain/entities/Route.ts` — fields: id, routeId, year, ghgIntensity, isBaseline, vesselType, fuelType, fuelConsumption, distance, totalEmissions
- [x] 1.4.2 Create `backend/src/core/domain/entities/ShipCompliance.ts` — fields: id, shipId, year, cbGco2eq
- [x] 1.4.3 Create `backend/src/core/domain/entities/BankEntry.ts` — fields: id, shipId, year, amountGco2eq
- [x] 1.4.4 Create `backend/src/core/domain/entities/Pool.ts` — fields: id, year, createdAt, members: PoolMember[]
- [x] 1.4.5 Create `backend/src/core/domain/entities/PoolMember.ts` — fields: poolId, shipId, cbBefore, cbAfter

### 1.5 Port Interfaces (Outbound)
- [x] 1.5.1 Create `backend/src/core/ports/outbound/RouteRepository.ts` — interface: `findAll()`, `findById(routeId)`, `findBaseline()`, `setBaseline(routeId)`, `findAllNonBaseline()`
- [x] 1.5.2 Create `backend/src/core/ports/outbound/ShipComplianceRepository.ts` — interface: `save(compliance)`, `findByShipAndYear(shipId, year)`
- [x] 1.5.3 Create `backend/src/core/ports/outbound/BankingRepository.ts` — interface: `save(entry)`, `findByShipAndYear(shipId, year)`, `getTotalBanked(shipId, year)`
- [x] 1.5.4 Create `backend/src/core/ports/outbound/PoolRepository.ts` — interface: `save(pool)`, `findById(poolId)`
- [x] 1.5.5 Create `backend/src/core/ports/outbound/index.ts` — re-exports all repository interfaces

### 1.6 Use-Case: ComputeCB
- [x] 1.6.1 Create `backend/src/core/use-cases/ComputeCB.ts`
  - Input: `{ shipId: string, year: number, ghgIntensity: number, fuelConsumption: number }`
  - Compute `energyInScope = fuelConsumption × 41000`
  - Compute `cb = (89.3368 − ghgIntensity) × energyInScope`
  - Persist snapshot via `ShipComplianceRepository.save()`
  - Return `{ cbBefore, applied, cbAfter }`
- [x] 1.6.2 Write unit tests for ComputeCB in `backend/src/core/use-cases/__tests__/ComputeCB.test.ts`
  - Test: known inputs produce exact CB value
  - Test: ghgIntensity = TARGET_INTENSITY → CB = 0
  - Test: ghgIntensity > TARGET → negative CB (deficit)
  - Test: invalid fuelConsumption (≤ 0) → DomainError
  - Test: invalid ghgIntensity (≤ 0) → DomainError

### 1.7 Use-Case: ComputeComparison
- [x] 1.7.1 Create `backend/src/core/use-cases/ComputeComparison.ts`
  - Fetch baseline via `RouteRepository.findBaseline()`
  - Fetch all non-baseline routes via `RouteRepository.findAllNonBaseline()`
  - For each comparison route compute: `percentDiff = ((compGhg / baseGhg) − 1) × 100`
  - Set `compliant = ghgIntensity <= 89.3368`
  - Return `{ baseline, comparisons: [{ route, percentDiff, compliant }] }`
  - Throw `ResourceNotFoundError` if no baseline exists
- [x] 1.7.2 Write unit tests for ComputeComparison in `backend/src/core/use-cases/__tests__/ComputeComparison.test.ts`
  - Test: percentDiff formula with known values
  - Test: compliant = true when ghgIntensity ≤ 89.3368
  - Test: compliant = false when ghgIntensity > 89.3368
  - Test: throws when no baseline route exists

### 1.8 Use-Case: BankSurplus
- [x] 1.8.1 Create `backend/src/core/use-cases/BankSurplus.ts`
  - Input: `{ shipId, year, cb }`
  - Validate `cb > 0`, else throw `InsufficientBalanceError`
  - Create `BankEntry { shipId, year, amountGco2eq: cb }`
  - Persist via `BankingRepository.save()`
  - Return saved entry
- [x] 1.8.2 Write unit tests for BankSurplus in `backend/src/core/use-cases/__tests__/BankSurplus.test.ts`
  - Test: positive CB creates a BankEntry with correct amount
  - Test: CB = 0 → DomainError (InsufficientBalanceError)
  - Test: negative CB → DomainError

### 1.9 Use-Case: ApplyBanked
- [x] 1.9.1 Create `backend/src/core/use-cases/ApplyBanked.ts`
  - Input: `{ shipId, year, amount }`
  - Fetch total banked via `BankingRepository.getTotalBanked(shipId, year)`
  - Validate `totalBanked >= amount`, else throw `InsufficientBalanceError`
  - Create negative `BankEntry { shipId, year, amountGco2eq: -amount }`
  - Persist via `BankingRepository.save()`
  - Return updated balance
- [x] 1.9.2 Write unit tests for ApplyBanked in `backend/src/core/use-cases/__tests__/ApplyBanked.test.ts`
  - Test: valid amount reduces ledger correctly
  - Test: amount = totalBanked → balance becomes 0 (boundary)
  - Test: amount > totalBanked → DomainError (InsufficientBalanceError)
  - Test: no prior bank entries → DomainError

### 1.10 Use-Case: CreatePool
- [x] 1.10.1 Create `backend/src/core/use-cases/CreatePool.ts`
  - Input: `{ shipIds: string[], year: number }`
  - Validate `shipIds.length >= 2`, else throw `InvalidInputError`
  - Fetch adjusted CB for each ship via `ShipComplianceRepository` + `BankingRepository`
  - Validate `sum(adjustedCBs) >= 0`, else throw `InvalidPoolError`
  - Execute Greedy_Allocation:
    1. Sort members descending by CB
    2. For each deficit member (CB < 0), transfer from highest-surplus member
    3. Ensure no ship exits worse than cb_before
    4. Ensure no surplus ship exits with negative CB
  - Persist Pool and PoolMembers via `PoolRepository.save()`
  - Return `{ poolId, year, members: [{ shipId, cbBefore, cbAfter }] }`
- [x] 1.10.2 Write unit tests for CreatePool in `backend/src/core/use-cases/__tests__/CreatePool.test.ts`
  - Test: two ships (one surplus, one deficit) → correct cb_after values
  - Test: three ships mixed → greedy allocation produces valid distribution
  - Test: total CB negative → InvalidPoolError
  - Test: fewer than two ships → InvalidInputError
  - Test: all ships surplus → cb_after = cb_before (no redistribution needed)
  - Test: deficit ship cannot exit worse than cb_before
  - Test: surplus ship cannot exit with negative CB

### 1.11 Use-Case: GetBankingRecords
- [x] 1.11.1 Create `backend/src/core/use-cases/GetBankingRecords.ts`
  - Input: `{ shipId, year }`
  - Fetch all entries via `BankingRepository.findByShipAndYear()`
  - Return list of BankEntry records

### 1.12 Use-Case: SetBaseline
- [x] 1.12.1 Create `backend/src/core/use-cases/SetBaseline.ts`
  - Input: `{ routeId }`
  - Verify route exists via `RouteRepository.findById()`, else throw `ResourceNotFoundError`
  - Call `RouteRepository.setBaseline(routeId)`
  - Return updated route

### 1.13 Use-Case: GetAdjustedCB
- [x] 1.13.1 Create `backend/src/core/use-cases/GetAdjustedCB.ts`
  - Input: `{ shipId, year }`
  - Fetch CB snapshot via `ShipComplianceRepository.findByShipAndYear()`
  - Fetch total applied via `BankingRepository.getTotalBanked(shipId, year)`
  - Return `{ cbBefore, applied, cbAfter: cbBefore + applied }`

---

## Phase 2 — Outbound Adapters (PostgreSQL Repositories)

### 2.1 Database Client Setup
- [x] 2.1.1 Install `pg`, `@types/pg`, `knex` (or `node-postgres` with raw queries — choose one and document)
- [x] 2.1.2 Create `backend/src/adapters/db/client.ts` — exports configured pg Pool using env vars (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
- [x] 2.1.3 Create `backend/src/adapters/db/migrations/` directory

### 2.2 Database Migrations
- [x] 2.2.1 Create migration `001_create_routes.sql` — creates routes table with all columns per Requirement 8.2
- [x] 2.2.2 Create migration `002_create_ship_compliance.sql` — creates ship_compliance table per Requirement 8.3
- [x] 2.2.3 Create migration `003_create_bank_entries.sql` — creates bank_entries table per Requirement 8.4
- [x] 2.2.4 Create migration `004_create_pools.sql` — creates pools table per Requirement 8.5
- [x] 2.2.5 Create migration `005_create_pool_members.sql` — creates pool_members table with FK to pools per Requirement 8.6
- [x] 2.2.6 Create `backend/src/adapters/db/migrate.ts` — script that runs all migrations in order

### 2.3 Seed Data
- [x] 2.3.1 Create `backend/src/adapters/db/seeds/routes.ts` — inserts R001–R005 with exact values, sets R001 is_baseline = true
- [x] 2.3.2 Create `backend/src/adapters/db/seed.ts` — script that runs all seeds (idempotent: skip if already seeded)

### 2.4 PostgreSQL Repository Adapters
- [x] 2.4.1 Create `backend/src/adapters/db/repositories/PgRouteRepository.ts` — implements `RouteRepository` port
  - `findAll()` → SELECT all routes, map to Route entity
  - `findById(routeId)` → SELECT WHERE route_id = $1
  - `findBaseline()` → SELECT WHERE is_baseline = true LIMIT 1
  - `setBaseline(routeId)` → UPDATE all to false, then UPDATE target to true (in transaction)
  - `findAllNonBaseline()` → SELECT WHERE is_baseline = false
- [x] 2.4.2 Create `backend/src/adapters/db/repositories/PgShipComplianceRepository.ts` — implements `ShipComplianceRepository` port
  - `save(compliance)` → INSERT into ship_compliance
  - `findByShipAndYear(shipId, year)` → SELECT WHERE ship_id = $1 AND year = $2 ORDER BY id DESC LIMIT 1
- [x] 2.4.3 Create `backend/src/adapters/db/repositories/PgBankingRepository.ts` — implements `BankingRepository` port
  - `save(entry)` → INSERT into bank_entries
  - `findByShipAndYear(shipId, year)` → SELECT WHERE ship_id = $1 AND year = $2
  - `getTotalBanked(shipId, year)` → SELECT SUM(amount_gco2eq) WHERE ship_id = $1 AND year = $2
- [x] 2.4.4 Create `backend/src/adapters/db/repositories/PgPoolRepository.ts` — implements `PoolRepository` port
  - `save(pool)` → INSERT into pools, then INSERT all pool_members (in transaction)
  - `findById(poolId)` → SELECT pool + JOIN pool_members

### 2.5 Repository Integration Tests
- [x] 2.5.1 Create `backend/src/adapters/db/__tests__/migrations.test.ts` — verifies all five tables exist after migration
- [x] 2.5.2 Create `backend/src/adapters/db/__tests__/seeds.test.ts` — verifies five routes present, R001 is baseline
- [x] 2.5.3 Create `backend/src/adapters/db/__tests__/PgRouteRepository.test.ts` — integration tests against test DB
- [ ] 2.5.4 Create `backend/src/adapters/db/__tests__/PgBankingRepository.test.ts` — verifies ledger sum never goes negative

---

## Phase 3 — Inbound Adapters (HTTP / Express Controllers)

### 3.1 Express App Setup
- [x] 3.1.1 Install `express`, `@types/express`, `cors`, `dotenv`
- [x] 3.1.2 Create `backend/src/adapters/http/app.ts` — creates Express app, registers middleware (JSON, CORS), mounts routers
- [x] 3.1.3 Create `backend/src/server.ts` — entry point, connects DB pool, starts HTTP server on PORT env var
- [x] 3.1.4 Create `backend/src/adapters/http/middleware/errorHandler.ts` — maps DomainError subtypes to HTTP status codes (InvalidInputError → 400, ResourceNotFoundError → 404, InsufficientBalanceError/InvalidPoolError → 422, generic → 500)

### 3.2 Routes Controller
- [x] 3.2.1 Create `backend/src/adapters/http/routes/routesRouter.ts`
  - `GET /routes` → invoke `GetAllRoutes` (or direct repo call), return JSON array
  - `POST /routes/:routeId/baseline` → invoke `SetBaseline` use-case, return updated route or 404
- [x] 3.2.2 Create `backend/src/adapters/http/routes/comparisonRouter.ts`
  - `GET /routes/comparison` → invoke `ComputeComparison` use-case, return `{ baseline, comparisons }`

### 3.3 Compliance Controller
- [x] 3.3.1 Create `backend/src/adapters/http/routes/complianceRouter.ts`
  - `GET /compliance/cb?shipId&year` → validate params, invoke `ComputeCB`, return `{ cbBefore, applied, cbAfter }`
  - `GET /compliance/adjusted-cb?shipId&year` → validate params, invoke `GetAdjustedCB`, return result

### 3.4 Banking Controller
- [x] 3.4.1 Create `backend/src/adapters/http/routes/bankingRouter.ts`
  - `GET /banking/records?shipId&year` → invoke `GetBankingRecords`, return array
  - `POST /banking/bank` → validate body `{ shipId, year, cb }`, invoke `BankSurplus`, return entry
  - `POST /banking/apply` → validate body `{ shipId, year, amount }`, invoke `ApplyBanked`, return updated balance

### 3.5 Pools Controller
- [x] 3.5.1 Create `backend/src/adapters/http/routes/poolsRouter.ts`
  - `POST /pools` → validate body `{ shipIds: string[], year: number }`, invoke `CreatePool`, return pool result

### 3.6 Dependency Injection / Composition Root
- [x] 3.6.1 Create `backend/src/composition/container.ts` — instantiates PgRepositories, injects into use-case constructors, exports use-case instances
- [x] 3.6.2 Update all routers to import use-case instances from container

### 3.7 HTTP Integration Tests (Supertest)
- [x] 3.7.1 Create `backend/src/adapters/http/__tests__/routes.test.ts`
  - GET /routes → 200, returns array with 5 routes
  - POST /routes/:routeId/baseline → 200, sets baseline
  - POST /routes/nonexistent/baseline → 404
- [x] 3.7.2 Create `backend/src/adapters/http/__tests__/comparison.test.ts`
  - GET /routes/comparison → 200, returns baseline + comparisons with percentDiff and compliant
  - GET /routes/comparison with no baseline → 400
- [x] 3.7.3 Create `backend/src/adapters/http/__tests__/compliance.test.ts`
  - GET /compliance/cb?shipId=S1&year=2025 → 200, correct CB values
  - GET /compliance/cb (missing params) → 400
  - GET /compliance/adjusted-cb → 200
- [x] 3.7.4 Create `backend/src/adapters/http/__tests__/banking.test.ts`
  - POST /banking/bank (positive CB) → 201
  - POST /banking/bank (negative CB) → 422
  - POST /banking/apply (valid amount) → 200
  - POST /banking/apply (over-apply) → 422
  - GET /banking/records → 200, returns entries
- [x] 3.7.5 Create `backend/src/adapters/http/__tests__/pools.test.ts`
  - POST /pools (valid members) → 201, returns cb_before and cb_after
  - POST /pools (total CB negative) → 422
  - POST /pools (single member) → 400

---

## Phase 4 — React Frontend

### 4.1 Frontend Project Setup
- [x] 4.1.1 Configure TailwindCSS in `frontend/` (tailwind.config.js, postcss.config.js, import in index.css)
- [x] 4.1.2 Install frontend dependencies: `axios` (or `fetch` wrapper), `recharts` (for charts), `react-query` or `swr` for data fetching
- [x] 4.1.3 Create `frontend/src/infrastructure/api/apiClient.ts` — Axios instance with baseURL from `VITE_API_URL` env var
- [x] 4.1.4 Create `frontend/src/infrastructure/api/` adapters for each domain area (routesApi, complianceApi, bankingApi, poolsApi)

### 4.2 Shared UI Components
- [x] 4.2.1 Create `frontend/src/components/ui/Badge.tsx` — renders ✓ (green) or ✗ (red) based on boolean prop
- [x] 4.2.2 Create `frontend/src/components/ui/KpiCard.tsx` — displays a label + numeric value card
- [x] 4.2.3 Create `frontend/src/components/ui/Table.tsx` — generic sortable table component
- [x] 4.2.4 Create `frontend/src/components/ui/Select.tsx` — dropdown filter component
- [x] 4.2.5 Create `frontend/src/components/ui/Button.tsx` — button with disabled state styling
- [x] 4.2.6 Create `frontend/src/components/layout/TabBar.tsx` — four-tab navigation (Routes, Compare, Banking, Pooling)
- [x] 4.2.7 Create `frontend/src/App.tsx` — renders TabBar and conditionally renders active tab panel

### 4.3 Routes Tab
- [x] 4.3.1 Create `frontend/src/features/routes/RoutesTab.tsx`
  - Fetches GET /routes on mount
  - Renders filter dropdowns for vesselType, fuelType, year
  - Renders Table with columns: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions
  - Each row has "Set Baseline" button → calls POST /routes/:routeId/baseline → refetches
- [x] 4.3.2 Create `frontend/src/features/routes/useRoutes.ts` — custom hook encapsulating fetch + filter logic

### 4.4 Compare Tab
- [x] 4.4.1 Create `frontend/src/features/compare/CompareTab.tsx`
  - Fetches GET /routes/comparison on mount
  - Renders Table with columns: routeId, ghgIntensity, percentDiff, compliant (Badge)
  - Renders BarChart (recharts) with ghgIntensity per route + ReferenceLine at 89.3368
- [x] 4.4.2 Create `frontend/src/features/compare/useComparison.ts` — custom hook for comparison data

### 4.5 Banking Tab
- [x] 4.5.1 Create `frontend/src/features/banking/BankingTab.tsx`
  - Input fields: shipId, year
  - "Fetch CB" button → GET /compliance/cb → displays KpiCard for cb_before, applied, cb_after
  - "Bank Surplus" button → POST /banking/bank → disabled when cb_before ≤ 0
  - "Apply Banked" button + amount input → POST /banking/apply → disabled when no banked balance
  - Displays bank records table from GET /banking/records
- [x] 4.5.2 Create `frontend/src/features/banking/useBanking.ts` — custom hook for banking state and actions

### 4.6 Pooling Tab
- [ ] 4.6.1 Create `frontend/src/features/pooling/PoolingTab.tsx`
  - Input: year selector, multi-select ship IDs
  - Fetches GET /compliance/adjusted-cb for each selected ship
  - Displays list of members with cb_before values
  - Pool sum indicator: green if sum ≥ 0, red if sum < 0
  - "Create Pool" button → POST /pools → disabled when sum < 0
  - After creation: displays cb_after for each member
- [x] 4.6.2 Create `frontend/src/features/pooling/usePooling.ts` — custom hook for pooling state and greedy preview

### 4.7 Frontend Environment Configuration
- [x] 4.7.1 Create `frontend/.env.example` with `VITE_API_URL=http://localhost:3000`
- [x] 4.7.2 Create `frontend/vite.config.ts` with proxy config for `/api` → backend in development

---

## Phase 5 — Documentation Files

### 5.1 AGENT_WORKFLOW.md
- [x] 5.1.1 Create `AGENT_WORKFLOW.md` at project root with the following sections:
  - **Agents Used**: List of AI agents/tools used during development
  - **Prompts & Outputs**: Example prompts given to agents with summarised outputs
  - **Validation/Corrections**: Cases where agent output required correction and how it was fixed
  - **Observations**: Patterns noticed in agent behaviour, strengths and limitations
  - **Best Practices Followed**: Coding standards, architecture decisions, testing discipline applied

### 5.2 README.md
- [x] 5.2.1 Create `README.md` at project root with sections:
  - **Overview**: What the platform does and which regulation it implements
  - **Architecture Summary**: Hexagonal architecture diagram (ASCII), layer descriptions
  - **Setup & Run Instructions**: Prerequisites, env var setup, `npm run migrate`, `npm run seed`, `npm run dev`
  - **How to Execute Tests**: `npm test` commands for backend unit, integration, and frontend tests
  - **Sample API Requests**: curl examples for all 9 endpoints

### 5.3 REFLECTION.md
- [x] 5.3.1 Create `REFLECTION.md` at project root with sections:
  - **What You Learned Using AI Agents**: Insights on AI-assisted development workflow
  - **Efficiency Gains vs Manual Coding**: Time saved, areas where AI excelled
  - **Improvements for Next Time**: What would be done differently in a future AI-assisted project
