-- Migration 002: Create ship_compliance table
-- Per Requirement 8.3: id (serial PK), ship_id (varchar), year (integer), cb_gco2eq (numeric)

CREATE TABLE IF NOT EXISTS ship_compliance (
    id SERIAL PRIMARY KEY,
    ship_id VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    cb_gco2eq NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_ship_compliance_ship_year ON ship_compliance(ship_id, year);
CREATE INDEX idx_ship_compliance_year ON ship_compliance(year);