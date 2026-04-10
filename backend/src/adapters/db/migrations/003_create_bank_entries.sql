-- Migration 003: Create bank_entries table
-- Per Requirement 8.4: id (serial PK), ship_id (varchar), year (integer), amount_gco2eq (numeric)

CREATE TABLE IF NOT EXISTS bank_entries (
    id SERIAL PRIMARY KEY,
    ship_id VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    amount_gco2eq NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_bank_entries_ship_year ON bank_entries(ship_id, year);
CREATE INDEX idx_bank_entries_year ON bank_entries(year);