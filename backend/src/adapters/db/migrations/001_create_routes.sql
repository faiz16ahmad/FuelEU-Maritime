-- Migration 001: Create routes table
-- Per Requirement 8.2: id (serial PK), route_id (varchar, unique), year (integer), 
-- ghg_intensity (numeric), is_baseline (boolean, default false), vessel_type (varchar), 
-- fuel_type (varchar), fuel_consumption (numeric), distance (numeric), total_emissions (numeric)

CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_id VARCHAR(50) UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    ghg_intensity NUMERIC(10, 4) NOT NULL,
    is_baseline BOOLEAN DEFAULT FALSE,
    vessel_type VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    fuel_consumption NUMERIC(12, 2) NOT NULL,
    distance NUMERIC(12, 2) NOT NULL,
    total_emissions NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_routes_year ON routes(year);
CREATE INDEX idx_routes_baseline ON routes(is_baseline);
CREATE INDEX idx_routes_vessel_type ON routes(vessel_type);
CREATE INDEX idx_routes_fuel_type ON routes(fuel_type);