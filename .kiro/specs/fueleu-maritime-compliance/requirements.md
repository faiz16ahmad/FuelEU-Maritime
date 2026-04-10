# Requirements Document

## Introduction

The FuelEU Maritime Compliance Platform is a full-stack web application that enables maritime operators to monitor, calculate, and manage greenhouse gas (GHG) intensity compliance under the FuelEU Maritime Regulation (EU 2023/1805). The platform implements the exact regulatory formulas for Compliance Balance (CB) computation, supports Article 20 Banking (carrying surplus CB forward across years), and Article 21 Pooling (redistributing CB among a fleet via greedy allocation). It exposes a React + TypeScript frontend with four functional tabs (Routes, Compare, Banking, Pooling) backed by a Node.js + TypeScript REST API persisting data in PostgreSQL. The entire system is structured using Hexagonal (Ports & Adapters) architecture so that domain logic is framework-free and independently testable.

---

## Glossary

- **FuelEU_Regulation**: EU Regulation 2023/1805 on the use of renewable and low-carbon fuels in maritime transport.
- **GHG_Intensity**: Greenhouse gas intensity of a voyage, expressed in gCO₂e per megajoule (gCO₂e/MJ).
- **Target_Intensity**: The regulatory GHG intensity ceiling for 2025, fixed at 89.3368 gCO₂e/MJ.
- **LCV**: Lower Calorific Value of fuel. For VLSFO, HFO, and MGO the constant is 41,000 MJ per tonne.
- **Energy_In_Scope**: Total energy consumed on a voyage in MJ, calculated as fuelConsumption (tonnes) × LCV (MJ/t).
- **Compliance_Balance (CB)**: The net compliance position of a ship for a given year, in gCO₂e. CB = (Target_Intensity − Actual_GHG_Intensity) × Energy_In_Scope. A positive CB is a surplus; a negative CB is a deficit.
- **Banking**: Article 20 mechanism allowing a ship with a positive CB to store that surplus for use in a future compliance year.
- **Pooling**: Article 21 mechanism allowing multiple ships to aggregate their CBs; a greedy allocation algorithm redistributes surplus from compliant ships to deficit ships.
- **Route**: A recorded voyage with attributes: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions.
- **Baseline_Route**: The single route designated as the reference point for GHG intensity comparison.
- **Comparison_Route**: Any non-baseline route compared against the Baseline_Route.
- **Pool**: A group of ships whose CBs are aggregated and redistributed under Article 21.
- **Pool_Member**: A ship participating in a Pool, with recorded cb_before and cb_after values.
- **Bank_Entry**: A ledger record of a banking or application transaction for a ship in a given year.
- **Ship_Compliance**: A snapshot record of a ship's CB for a given year.
- **Greedy_Allocation**: The pool redistribution algorithm that sorts members descending by CB, then iteratively transfers surplus to deficits until all deficits are resolved or surplus is exhausted.
- **System**: The FuelEU Maritime Compliance Platform as a whole.
- **API**: The Node.js/Express HTTP backend.
- **UI**: The React/TypeScript frontend application.
- **DB**: The PostgreSQL relational database.
- **Core**: The framework-free domain layer containing entities, value objects, use-cases, and port interfaces.
- **Adapter**: An implementation of a port interface that connects Core to an external concern (DB, HTTP, UI).

---

## Requirements

### Requirement 1: GHG Intensity and Compliance Balance Computation

**User Story:** As a compliance officer, I want the platform to compute GHG intensity and Compliance Balance using the exact FuelEU regulatory formulas, so that all calculations are auditable and regulation-compliant.

#### Acceptance Criteria

1. THE Core SHALL define Target_Intensity as the constant 89.3368 gCO₂e/MJ.
2. THE Core SHALL define LCV as the constant 41,000 MJ per tonne for fuel types HFO, VLSFO, and MGO.
3. WHEN a fuel consumption value in tonnes and a GHG intensity value in gCO₂e/MJ are provided, THE Core SHALL compute Energy_In_Scope as fuelConsumption × 41,000.
4. WHEN Energy_In_Scope and Actual_GHG_Intensity are available, THE Core SHALL compute Compliance_Balance as (Target_Intensity − Actual_GHG_Intensity) × Energy_In_Scope.
5. WHEN Compliance_Balance is greater than zero, THE Core SHALL classify the result as a surplus.
6. WHEN Compliance_Balance is less than zero, THE Core SHALL classify the result as a deficit.
7. WHEN Compliance_Balance equals zero, THE Core SHALL classify the result as exactly compliant.
8. THE Core SHALL express Compliance_Balance in gCO₂e with at least four decimal places of precision.
9. IF a fuel consumption value of zero or negative is provided, THEN THE Core SHALL return a domain error indicating invalid fuel consumption.
10. IF a GHG intensity value of zero or negative is provided, THEN THE Core SHALL return a domain error indicating invalid GHG intensity.

---

### Requirement 2: Route Data Management

**User Story:** As a fleet manager, I want to store and retrieve voyage route records with their GHG attributes, so that I can track the emissions profile of each voyage.

#### Acceptance Criteria

1. THE DB SHALL persist routes with the fields: id, route_id, year, ghg_intensity, is_baseline, vessel_type, fuel_type, fuel_consumption, distance, total_emissions.
2. THE API SHALL expose a GET /routes endpoint that returns all persisted routes.
3. WHEN GET /routes is called, THE API SHALL return each route with fields: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions.
4. THE DB SHALL be seeded with exactly five routes as specified in the seed data (R001–R005) on first initialisation.
5. WHEN the DB is seeded, THE DB SHALL mark route R001 as the default baseline (is_baseline = true).
6. THE API SHALL expose a POST /routes/:routeId/baseline endpoint.
7. WHEN POST /routes/:routeId/baseline is called, THE API SHALL set is_baseline = true for the specified route and set is_baseline = false for all other routes.
8. IF POST /routes/:routeId/baseline is called with a routeId that does not exist, THEN THE API SHALL return HTTP 404 with a descriptive error message.
9. THE UI SHALL display all routes in a table with columns: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption, distance, totalEmissions.
10. THE UI SHALL provide filters for vesselType, fuelType, and year on the Routes tab.
11. WHEN a filter is applied, THE UI SHALL display only routes matching all active filter criteria.
12. THE UI SHALL display a "Set Baseline" button for each route row.
13. WHEN the "Set Baseline" button is clicked for a route, THE UI SHALL call POST /routes/:routeId/baseline and refresh the route list.

---

### Requirement 3: Route Comparison

**User Story:** As a compliance analyst, I want to compare non-baseline routes against the baseline route's GHG intensity, so that I can identify which voyages are above or below the regulatory target.

#### Acceptance Criteria

1. THE API SHALL expose a GET /routes/comparison endpoint.
2. WHEN GET /routes/comparison is called, THE API SHALL return the baseline route and all non-baseline routes with computed percentDiff and compliant fields.
3. WHEN computing percentDiff, THE Core SHALL apply the formula: percentDiff = ((comparisonGhgIntensity / baselineGhgIntensity) − 1) × 100.
4. WHEN a route's ghgIntensity is less than or equal to Target_Intensity (89.3368 gCO₂e/MJ), THE Core SHALL set compliant = true for that route.
5. WHEN a route's ghgIntensity is greater than Target_Intensity, THE Core SHALL set compliant = false for that route.
6. IF no baseline route exists when GET /routes/comparison is called, THEN THE API SHALL return HTTP 400 with a message indicating no baseline is set.
7. THE UI SHALL display comparison results in a table with columns: routeId, ghgIntensity, percentDiff, compliant (rendered as ✓ or ✗).
8. THE UI SHALL render a bar or line chart visualising ghgIntensity values across routes, with a reference line at Target_Intensity = 89.3368 gCO₂e/MJ.
9. WHEN a route is compliant, THE UI SHALL render the compliant indicator in green.
10. WHEN a route is non-compliant, THE UI SHALL render the compliant indicator in red.

---

### Requirement 4: Compliance Balance Retrieval and Persistence

**User Story:** As a compliance officer, I want to retrieve and persist a ship's Compliance Balance for a given year, so that I have an auditable snapshot of each ship's regulatory position.

#### Acceptance Criteria

1. THE API SHALL expose a GET /compliance/cb endpoint accepting query parameters shipId and year.
2. WHEN GET /compliance/cb is called with valid shipId and year, THE Core SHALL compute CB using the formula defined in Requirement 1.
3. WHEN CB is computed, THE API SHALL persist a Ship_Compliance snapshot record with ship_id, year, and cb_gco2eq.
4. WHEN GET /compliance/cb is called, THE API SHALL return cb_before (CB before any bank applications), applied (total banked amount applied), and cb_after (CB after bank applications).
5. THE API SHALL expose a GET /compliance/adjusted-cb endpoint accepting query parameters shipId and year.
6. WHEN GET /compliance/adjusted-cb is called, THE API SHALL return the CB adjusted by all Bank_Entry applications recorded for that ship and year.
7. IF shipId or year query parameters are missing, THEN THE API SHALL return HTTP 400 with a descriptive error message.
8. THE UI Banking tab SHALL display KPI cards for cb_before, applied, and cb_after.

---

### Requirement 5: Banking — Article 20 Surplus Carry-Forward

**User Story:** As a fleet operator, I want to bank a ship's positive Compliance Balance so that the surplus can be applied to offset a deficit in a future compliance year.

#### Acceptance Criteria

1. THE DB SHALL persist bank_entries with fields: id, ship_id, year, amount_gco2eq.
2. THE API SHALL expose a POST /banking/bank endpoint.
3. WHEN POST /banking/bank is called with a positive CB for a ship and year, THE Core SHALL create a Bank_Entry recording the surplus amount.
4. IF POST /banking/bank is called when the ship's CB for that year is zero or negative, THEN THE Core SHALL return a domain error and THE API SHALL return HTTP 422 with a message indicating no surplus to bank.
5. THE API SHALL expose a POST /banking/apply endpoint.
6. WHEN POST /banking/apply is called with a shipId, year, and amount, THE Core SHALL verify that the total available banked amount for that ship is greater than or equal to the requested amount.
7. WHEN the available banked amount is sufficient, THE Core SHALL create a negative Bank_Entry reducing the available balance by the requested amount.
8. IF POST /banking/apply is called with an amount exceeding the total available banked balance, THEN THE Core SHALL return a domain error and THE API SHALL return HTTP 422 with a message indicating insufficient banked balance.
9. THE Core SHALL maintain a non-negative banking ledger at all times; the sum of all Bank_Entry records for a ship SHALL never be negative.
10. THE API SHALL expose a GET /banking/records endpoint accepting query parameters shipId and year, returning all Bank_Entry records for that ship and year.
11. THE UI Banking tab SHALL disable the "Bank Surplus" action when cb_before is zero or negative.
12. THE UI Banking tab SHALL disable the "Apply Banked" action when no banked balance is available.

---

### Requirement 6: Pooling — Article 21 Greedy Allocation

**User Story:** As a fleet operator, I want to create a compliance pool from multiple ships so that surplus CB from compliant ships offsets deficits in non-compliant ships, reducing the fleet's overall penalty exposure.

#### Acceptance Criteria

1. THE DB SHALL persist pools with fields: id, year, created_at.
2. THE DB SHALL persist pool_members with fields: pool_id, ship_id, cb_before, cb_after.
3. THE API SHALL expose a POST /pools endpoint accepting a list of ship IDs and a year.
4. WHEN POST /pools is called, THE Core SHALL retrieve the adjusted CB for each ship in the list.
5. WHEN the Greedy_Allocation algorithm is executed, THE Core SHALL sort pool members in descending order by CB.
6. WHEN the Greedy_Allocation algorithm is executed, THE Core SHALL iteratively transfer surplus from the highest-CB member to the lowest-CB (most deficit) member until all deficits are resolved or all surplus is exhausted.
7. WHEN Greedy_Allocation completes, THE Core SHALL ensure no ship exits the pool with a CB lower than its cb_before value.
8. WHEN Greedy_Allocation completes, THE Core SHALL ensure no surplus ship exits the pool with a negative CB.
9. WHEN the sum of all members' adjusted CBs is negative, THE Core SHALL return a domain error and THE API SHALL return HTTP 422 indicating the pool cannot be formed because total deficit exceeds total surplus.
10. WHEN a valid pool is formed, THE API SHALL persist the Pool and all Pool_Member records with cb_before and cb_after values.
11. WHEN a valid pool is formed, THE API SHALL return the pool id, year, and the list of members with cb_before and cb_after.
12. THE UI Pooling tab SHALL display each candidate ship with its cb_before value.
13. THE UI Pooling tab SHALL display a pool sum indicator showing the aggregate CB in green when non-negative and red when negative.
14. THE UI Pooling tab SHALL disable the "Create Pool" button when the aggregate CB of selected members is negative.
15. WHEN a pool is successfully created, THE UI Pooling tab SHALL display each member's cb_after value alongside cb_before.
16. IF POST /pools is called with fewer than two ship IDs, THEN THE API SHALL return HTTP 400 with a message indicating a pool requires at least two members.

---

### Requirement 7: Hexagonal Architecture and Framework Independence

**User Story:** As a software architect, I want the domain logic to be completely isolated from framework and infrastructure concerns, so that it can be unit-tested without any database or HTTP dependencies.

#### Acceptance Criteria

1. THE Core SHALL contain all domain entities, value objects, use-case implementations, and port interfaces.
2. THE Core SHALL have zero runtime dependencies on Express, PostgreSQL client libraries, React, or any other framework.
3. WHEN a use-case is invoked, THE Core SHALL interact with external systems exclusively through port interfaces (repository ports, event ports).
4. THE Adapter layer SHALL implement all port interfaces defined in Core.
5. THE Core use-cases SHALL be unit-testable by injecting in-memory stub implementations of port interfaces.
6. THE Core SHALL export typed port interfaces for: RouteRepository, ShipComplianceRepository, BankingRepository, PoolRepository.
7. WHEN a domain rule is violated (invalid input, insufficient balance, invalid pool), THE Core SHALL throw a typed DomainError rather than a generic Error.

---

### Requirement 8: Database Schema, Migrations, and Seed Data

**User Story:** As a developer, I want the database schema to be managed through versioned migrations and seeded with representative data, so that the environment is reproducible and testable.

#### Acceptance Criteria

1. THE DB SHALL be initialised via versioned migration scripts that create all required tables (routes, ship_compliance, bank_entries, pools, pool_members).
2. WHEN migrations are run, THE DB SHALL create the routes table with columns: id (serial PK), route_id (varchar, unique), year (integer), ghg_intensity (numeric), is_baseline (boolean, default false), vessel_type (varchar), fuel_type (varchar), fuel_consumption (numeric), distance (numeric), total_emissions (numeric).
3. WHEN migrations are run, THE DB SHALL create the ship_compliance table with columns: id (serial PK), ship_id (varchar), year (integer), cb_gco2eq (numeric).
4. WHEN migrations are run, THE DB SHALL create the bank_entries table with columns: id (serial PK), ship_id (varchar), year (integer), amount_gco2eq (numeric).
5. WHEN migrations are run, THE DB SHALL create the pools table with columns: id (serial PK), year (integer), created_at (timestamp).
6. WHEN migrations are run, THE DB SHALL create the pool_members table with columns: pool_id (integer FK → pools.id), ship_id (varchar), cb_before (numeric), cb_after (numeric).
7. WHEN seed scripts are run, THE DB SHALL insert the five routes R001–R005 with the exact attribute values specified in the seed data table.
8. WHEN seed scripts are run, THE DB SHALL set is_baseline = true for route R001 and is_baseline = false for all other routes.
9. THE System SHALL provide a single command to run migrations and seeds in sequence.

---

### Requirement 9: API Error Handling and Validation

**User Story:** As a frontend developer, I want the API to return consistent, descriptive error responses, so that the UI can display meaningful feedback to users.

#### Acceptance Criteria

1. WHEN an API endpoint receives a request with missing required parameters, THE API SHALL return HTTP 400 with a JSON body containing a message field describing the missing parameter.
2. WHEN an API endpoint cannot find a requested resource, THE API SHALL return HTTP 404 with a JSON body containing a message field.
3. WHEN a domain rule is violated, THE API SHALL return HTTP 422 with a JSON body containing a message field describing the violation.
4. WHEN an unexpected server error occurs, THE API SHALL return HTTP 500 with a JSON body containing a message field.
5. THE API SHALL return all responses with Content-Type: application/json.
6. THE API SHALL support CORS for requests originating from the UI development origin.

---

### Requirement 10: Automated Testing

**User Story:** As a developer, I want a comprehensive automated test suite covering domain logic and HTTP endpoints, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE System SHALL include unit tests for the ComputeComparison use-case verifying percentDiff and compliant calculations.
2. THE System SHALL include unit tests for the ComputeCB use-case verifying the CB formula with known inputs and expected outputs.
3. THE System SHALL include unit tests for the BankSurplus use-case verifying that a positive CB creates a Bank_Entry and a non-positive CB returns a domain error.
4. THE System SHALL include unit tests for the ApplyBanked use-case verifying that a valid amount reduces the ledger and an over-apply returns a domain error.
5. THE System SHALL include unit tests for the CreatePool use-case verifying the Greedy_Allocation algorithm produces correct cb_after values and rejects invalid pools.
6. THE System SHALL include integration tests for all HTTP endpoints using Supertest against a test database.
7. THE System SHALL include a test verifying that migrations and seeds load correctly and the five seed routes are present.
8. THE System SHALL include edge-case tests for: negative CB input to banking, over-application of banked balance, and pool formation where total CB is negative.
9. WHEN all tests are run, THE System SHALL report pass/fail results with descriptive test names.

---

### Requirement 11: Documentation

**User Story:** As a project reviewer, I want comprehensive documentation covering architecture, setup, AI workflow, and reflections, so that the project can be evaluated and reproduced.

#### Acceptance Criteria

1. THE System SHALL include a README.md with sections: Overview, Architecture Summary, Setup & Run Instructions, How to Execute Tests, and Sample API Requests.
2. THE System SHALL include an AGENT_WORKFLOW.md with sections: Agents Used, Prompts & Outputs (with examples), Validation/Corrections, Observations, and Best Practices Followed.
3. THE System SHALL include a REFLECTION.md with sections: What You Learned Using AI Agents, Efficiency Gains vs Manual Coding, and Improvements for Next Time.
4. WHEN setup instructions are followed, THE System SHALL be runnable with no additional manual configuration steps beyond those documented.
