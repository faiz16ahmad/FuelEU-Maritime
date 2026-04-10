-- Migration 005: Create pool_members table
-- Per Requirement 8.6: pool_id (integer FK → pools.id), ship_id (varchar), cb_before (numeric), cb_after (numeric)

CREATE TABLE IF NOT EXISTS pool_members (
    pool_id INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    ship_id VARCHAR(50) NOT NULL,
    cb_before NUMERIC(15, 4) NOT NULL,
    cb_after NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pool_id, ship_id)
);

-- Index for performance
CREATE INDEX idx_pool_members_pool_id ON pool_members(pool_id);
CREATE INDEX idx_pool_members_ship_id ON pool_members(ship_id);