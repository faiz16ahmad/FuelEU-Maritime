# Agent Workflow Documentation

# AI Agent Workflow Log

## Agents Used
- **KIRO IDE:** Primary architect and code generator (Spec-driven development).
- *(Add Codex/Copilot here later if you use them for inline autocomplete)*

---

## Phase 0: Project Initialization & Specification Generation

### Prompts & Outputs
**Objective:** Generate a strict Hexagonal Architecture plan and extract the correct domain math for the FuelEU compliance requirements.

**Prompt Used:**
> "System Role: You are an expert Full-Stack Software Architect. We are building a compliance platform for the FuelEU Maritime regulation.
> Inputs Provided:
> 1. The full assignment brief (detailing a React/Node/PostgreSQL stack).
> 2. The official ESSF SAPS WS1 FuelEU Calculation Methodologies PDF.
> Primary Directives:
> 1. Hexagonal Architecture (Strict): The codebase must be strictly divided into core/ (domain logic, use-cases, ports) and adapters/ (UI, API, DB). There must be zero framework dependencies (no Express, React, or PostgreSQL) inside the core/ folder.
> 2. Domain Mathematics: Extract the exact mathematical formulas for the Compliance Balance (CB) from the provided PDF. Explicitly use the 2025 target intensity of 89.3368 gCO₂e/MJ and the LCV constant of 41,000 MJ/t for VLSFO.
> 3. Ledger & Algorithmic Logic: The Banking mechanism must be implemented as a strict transactional ledger (preventing negative banking). The Pooling mechanism must utilize a greedy allocation algorithm to distribute surplus to deficits without driving any ship into a negative balance.
> 4. Test-Driven: Generate unit tests for the core/domain math using the specific numerical examples found in Chapter 1.4 of the ESSF PDF.
> First Output Required: Do not generate codebase files yet. Generate a highly detailed tasks.md file breaking down the execution into logical steps, starting exclusively with the pure core/domain logic, followed by outbound adapters, inbound adapters, and finally the React frontend. Also, initialize the AGENT_WORKFLOW.md template."

**Output:** KIRO generated an 11-point EARS-compliant requirement spec and a 5-phase `tasks.md` file. It correctly isolated Phase 1 strictly to pure `core/domain` TypeScript with zero framework dependencies.

### Validation / Corrections
- **Observation:** Initially faced an issue where the full 115-page ESSF reference PDF exceeded KIRO's context limits. 
- **Correction/Bypass:** Instead of relying on the AI to filter the entire legal document, I manually printed pages 1-45 as a new PDF and provided that. This bypassed the context limit and ensured the AI focused exclusively on the relevant mathematical formulas rather than irrelevant legal annexes.
- **Validation:** Verified that KIRO's generated `tasks.md` correctly identified the constants (89.3368 gCO₂e/MJ and 41,000 MJ/t) from the truncated PDF and accurately planned the greedy allocation algorithm for the Pooling tab.

---

## Phase 1: Core Domain Logic & Algorithms

### Prompts & Outputs
**Objective:** Execute Phase 1 to generate pure TypeScript domain entities, value objects, and use-cases based on the agreed-upon specifications.

**Prompt Used:**
> "Execute Phase 1 of tasks.md."

**Output:** KIRO successfully generated all requested files. It created custom Value Objects (`GhgIntensity`, `FuelConsumption`) and Entities (`Route`, `Pool`). It implemented the `ComputeCB` math, the strict `BankSurplus` ledger, and the `CreatePool` greedy allocation algorithm. It also generated 23 passing unit tests.

### Validation / Corrections
- **Validation (Architecture):** Manually reviewed the `core/` directory to ensure strict adherence to Hexagonal Architecture. Verified that absolutely zero external framework dependencies (like Express or PostgreSQL/Prisma) were imported. The logic is 100% isolated.
- **Validation (Domain Math):** Checked `ComputeCB.ts` and `constants.ts` to confirm the LCV constant (41,000) and Target Intensity (89.3368) were correctly applied to the compliance balance formula. 
- **Observations:** KIRO efficiently utilized custom domain errors (e.g., `InsufficientBalanceError`) mapping exactly to a financial ledger mechanic, ensuring environmental credits cannot be overdrawn. The greedy algorithm for pooling distributed surpluses effectively without driving any individual ship into a deficit.

### Best Practices Followed (So Far)
- **Spec-Driven AI Execution:** Used KIRO to generate a strict `tasks.md` before allowing any code generation, preventing the AI from hallucinating architecture.
- **Domain-Driven Design (DDD):** Enforced the use of Value Objects to validate physical constraints (e.g., fuel consumption cannot be negative) before passing data to the use-cases.
- **Incremental Version Control:** Committed Phase 1 separately to prove the core domain was built and tested in complete isolation from the infrastructure layer.

## Phase 2: Outbound Adapters (PostgreSQL & Repositories)

### Prompts & Outputs
**Objective:** Execute Phase 2 to build the PostgreSQL database infrastructure and connect it to the pure Phase 1 logic using the established Port interfaces.

**Prompt Used:**
> "All Phase 1 tests are passing. Execute Phase 2 of tasks.md. Important directives for this phase: Use `pg` and raw SQL queries (or `knex`, choose one and be consistent) for the repositories. Ensure the `PgRouteRepository` implements the exact interface defined in the `core/ports`. Provide the `.env.example` file with standard local PostgreSQL credentials."

**Output:** KIRO successfully generated 5 SQL migration files, a seed script with the required R001-R005 data, and 4 PostgreSQL repository classes implementing the core interfaces. It also provided integration test suites.

### Validation / Corrections
- **Validation (Architecture Integrity):** Verified that the new `PgRouteRepository` correctly implements the `RouteRepository` interface defined in the `core/` folder. The dependency points *inward* (adapters depend on core), preserving the Hexagonal Architecture. 
- **Validation (Data Precision):** Checked the `seeds.ts` file to ensure the mock dataset matches the exact values provided in the assignment brief (e.g., R001: Container, HFO, 2024, 91.05 ghgIntensity, isBaseline: true).
- **Observations:** KIRO successfully utilized SQL transactions within the `PgPoolRepository.save()` method to ensure that if saving a `pool_member` fails, the `pool` creation is rolled back, guaranteeing database consistency for the ledger.

## Best Practices Followed

- **Hexagonal Architecture**: All domain logic in `core/` with zero framework dependencies; adapters implement port interfaces
- **EARS Requirements**: All acceptance criteria written using EARS patterns (Ubiquitous, Event-driven, State-driven, Unwanted event)
- **Test-Driven Development**: Unit tests written alongside use-case implementations before adapter integration
- **Typed Domain Errors**: `DomainError` subtypes used throughout core to enable precise HTTP status mapping at the adapter boundary
- **Immutable Constants**: Regulatory constants (`TARGET_INTENSITY`, `LCV_MJ_PER_TONNE`) defined once in `core/domain/constants.ts`
- **Transactional Integrity**: Banking ledger and pool persistence use DB transactions to prevent partial writes
- **Seed Idempotency**: Seed scripts check for existing data before inserting to support repeated runs
