-- Migration 004: Create pools table
-- Per Requirement 8.5: id (serial PK), year (integer), created_at (timestamp)

CREATE TABLE IF NOT EXISTS pools (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_pools_year ON pools(year);
CREATE INDEX idx_pools_created_at ON pools(created_at);