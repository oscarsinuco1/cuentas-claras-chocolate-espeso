-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better query performance
-- These will be created by Prisma, but we define them here for reference

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_plan_code ON "Plan"(code);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_history_plan_created ON "HistoryEntry"("planId", "createdAt" DESC);
