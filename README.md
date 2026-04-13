# FuelEU Maritime Compliance Platform

A comprehensive compliance dashboard for the **EU Regulation 2023/1805** (FuelEU Maritime), implementing Article 20 (Banking) and Article 21 (Pooling) mechanisms with strict mathematical accuracy.

## Overview

This platform implements the FuelEU Maritime regulation compliance calculations, enabling shipping companies to:

- **Calculate Compliance Balance (CB)** using the official formula: `CB = (89.3368 - GHG_intensity) × Energy_in_scope`
- **Manage Banking** (Article 20): Bank surplus compliance balance for future use
- **Create Pools** (Article 21): Distribute surplus between ships using greedy allocation algorithm
- **Compare Routes** against the 2025 target intensity of 89.3368 gCO₂e/MJ
- **Track Compliance** across multiple vessels and years

## Architecture Summary

The platform follows **Hexagonal Architecture** (Ports & Adapters) with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Routes Tab  │ │ Compare Tab │ │ Banking Tab │ ...       │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API
┌─────────────────────┴───────────────────────────────────────┐
│                 BACKEND (Node.js)                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              INBOUND ADAPTERS                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │   Express   │ │   Routes    │ │   Banking   │ ...   │ │
│  │  │   Server    │ │  Controller │ │ Controller  │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └─────────────────────┬───────────────────────────────────┘ │
│  ┌─────────────────────┴───────────────────────────────────┐ │
│  │                 CORE DOMAIN                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │   Domain    │ │  Use Cases  │ │    Ports    │       │ │
│  │  │  Entities   │ │  (Business  │ │ (Interfaces)│       │ │
│  │  │ & V.Objects │ │    Logic)   │ │             │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └─────────────────────┬───────────────────────────────────┘ │
│  ┌─────────────────────┴───────────────────────────────────┐ │
│  │              OUTBOUND ADAPTERS                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │
│  │  │ PostgreSQL  │ │   Route     │ │   Banking   │ ...   │ │
│  │  │  Database   │ │ Repository  │ │ Repository  │       │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘       │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Layer Descriptions

- **Frontend (React)**: User interface with 4 tabs implementing domain rule enforcement
- **Inbound Adapters**: HTTP controllers that parse requests and delegate to use cases
- **Core Domain**: Pure business logic with zero framework dependencies
- **Outbound Adapters**: Database repositories implementing core port interfaces

## Setup & Run Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ database server
- **Git** for version control

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FuelEU-Maritime
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your PostgreSQL credentials
   
   # Frontend  
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with API URL (default: http://localhost:3000)
   ```

4. **Setup database:**
   ```bash
   cd backend
   npm run migrate    # Run database migrations
   npm run seed      # Seed with R001-R005 route data
   ```

### Running the Application

**Option 1: Two terminals (recommended)**
```bash
# Terminal 1 - Backend API
cd backend
npm run dev        # Starts on http://localhost:3000

# Terminal 2 - Frontend UI  
cd frontend
npm run dev        # Starts on http://localhost:5174
```

**Option 2: From root directory**
```bash
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

### Access the Application

- **Frontend Dashboard**: http://localhost:5174
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health

## How to Execute Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only  
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend

# Run component tests
npm test

# Run with watch mode
npm run test:watch
```

### Full Test Suite

```bash
# From root directory
npm run test:all
```

## Sample API Requests

### 1. Get All Routes
```bash
curl -X GET http://localhost:3000/routes
```

### 2. Set Baseline Route
```bash
curl -X POST http://localhost:3000/routes/R001/baseline
```

### 3. Get Route Comparison
```bash
curl -X GET http://localhost:3000/routes/comparison
```

### 4. Calculate Compliance Balance
```bash
curl -X GET "http://localhost:3000/compliance/cb?shipId=S001&year=2025&ghgIntensity=91.0&fuelConsumption=5000"
```

### 5. Get Adjusted Compliance Balance
```bash
curl -X GET "http://localhost:3000/compliance/adjusted-cb?shipId=S001&year=2025"
```

### 6. Bank Surplus
```bash
curl -X POST http://localhost:3000/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId": "S001", "year": 2025, "cb": 15000}'
```

### 7. Apply Banked Credits
```bash
curl -X POST http://localhost:3000/banking/apply \
  -H "Content-Type: application/json" \
  -d '{"shipId": "S001", "year": 2025, "amount": 5000}'
```

### 8. Get Banking Records
```bash
curl -X GET "http://localhost:3000/banking/records?shipId=S001&year=2025"
```

### 9. Create Pool
```bash
curl -X POST http://localhost:3000/pools \
  -H "Content-Type: application/json" \
  -d '{"shipIds": ["S001", "S002", "S003"], "year": 2025}'
```

## Key Features

### Domain Rule Enforcement

- **Banking Tab**: "Bank Surplus" button disabled when CB ≤ 0
- **Pooling Tab**: Red indicator and disabled "Create Pool" when sum < 0  
- **Compare Tab**: Bar chart with reference line at 89.3368 gCO₂e/MJ
- **Routes Tab**: Baseline selection with automatic data refresh

### Mathematical Accuracy

- **Target Intensity**: 89.3368 gCO₂e/MJ (2025 FuelEU regulation)
- **LCV Constant**: 41,000 MJ/t for VLSFO fuel
- **Compliance Balance**: `CB = (TARGET_INTENSITY - ghgIntensity) × energyInScope`
- **Greedy Allocation**: Distributes surplus to deficits without negative balances

### Data Integrity

- **Transactional Banking**: Prevents negative banking ledger
- **Pool Validation**: Ensures total CB ≥ 0 before pool creation
- **Seed Idempotency**: Safe to run migrations/seeds multiple times

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Recharts, React Query
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Jest, Supertest
- **Database**: PostgreSQL with raw SQL queries
- **Testing**: Jest (unit), Supertest (integration), React Testing Library
- **Architecture**: Hexagonal (Ports & Adapters), Domain-Driven Design

## Project Structure

```
FuelEU-Maritime/
├── backend/
│   ├── src/
│   │   ├── core/                 # Pure domain logic
│   │   │   ├── domain/           # Entities, value objects, constants
│   │   │   ├── use-cases/        # Business logic
│   │   │   └── ports/            # Interface definitions
│   │   ├── adapters/             # Framework integrations
│   │   │   ├── db/               # PostgreSQL repositories
│   │   │   └── http/             # Express controllers
│   │   └── composition/          # Dependency injection
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── features/             # Feature-specific components
│   │   └── infrastructure/       # API clients
│   ├── package.json
│   └── vite.config.ts
├── .kiro/specs/                  # Specification documents
├── AGENT_WORKFLOW.md             # AI development log
└── README.md
```

## Contributing

1. Follow the hexagonal architecture principles
2. Write tests for all use cases and components  
3. Use EARS format for requirements
4. Maintain zero framework dependencies in `core/`
5. Update `AGENT_WORKFLOW.md` for significant changes

## License

This project implements EU Regulation 2023/1805 for educational and compliance purposes.