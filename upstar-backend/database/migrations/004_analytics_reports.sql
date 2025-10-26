-- Migration: 004_analytics_reports.sql
-- Description: Create analytics reports table
-- Created: 2024-01-01

-- Analytics reports table
CREATE TABLE IF NOT EXISTS analytics_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(100) NOT NULL,
    date_range JSONB NOT NULL,
    data JSONB NOT NULL,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_created_at ON analytics_reports(created_at);





