# Agent Workflow Documentation

## Agents Used

| Agent / Tool | Role |
|Kiro IDE (AWS)|spec generation, code scaffolding, test writing|

---

## Prompts & Outputs

### Example 1 — Requirements Generation

**Prompt:**
> _Paste the prompt used to generate requirements here_

**Output Summary:**
> _Summarise what the agent produced, e.g., "Generated 11 requirements covering domain math, CRUD, banking, pooling, architecture, testing, and documentation."_

**Notes:**
> _Any observations about quality, accuracy, or gaps_

---

### Example 2 — Domain Logic Scaffolding

**Prompt:**
> _Paste the prompt used_

**Output Summary:**
> _Summarise the output_

**Notes:**
> _Observations_

---

### Example 3 — Test Generation

**Prompt:**
> _Paste the prompt used_

**Output Summary:**
> _Summarise the output_

**Notes:**
> _Observations_

---

_(Add more examples as needed)_

---

## Validation / Corrections

| Step | Issue Found | Correction Applied |
|---|---|---|
| _e.g., ComputeCB formula_ | _Agent used wrong LCV constant_ | _Corrected to 41,000 MJ/t per regulation_ |
| | | |

---

## Observations

- _e.g., Agent correctly identified the need for a Greedy Allocation algorithm without explicit instruction_
- _e.g., Agent occasionally generated framework imports inside core/ — required prompt reinforcement of hexagonal architecture constraint_
- _Add observations as implementation progresses_

---

## Best Practices Followed

- **Hexagonal Architecture**: All domain logic in `core/` with zero framework dependencies; adapters implement port interfaces
- **EARS Requirements**: All acceptance criteria written using EARS patterns (Ubiquitous, Event-driven, State-driven, Unwanted event)
- **Test-Driven Development**: Unit tests written alongside use-case implementations before adapter integration
- **Typed Domain Errors**: `DomainError` subtypes used throughout core to enable precise HTTP status mapping at the adapter boundary
- **Immutable Constants**: Regulatory constants (`TARGET_INTENSITY`, `LCV_MJ_PER_TONNE`) defined once in `core/domain/constants.ts`
- **Transactional Integrity**: Banking ledger and pool persistence use DB transactions to prevent partial writes
- **Seed Idempotency**: Seed scripts check for existing data before inserting to support repeated runs
