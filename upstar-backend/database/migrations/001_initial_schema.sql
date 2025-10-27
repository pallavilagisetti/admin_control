-- Migration: 001_initial_schema.sql
-- Description: Initial database schema creation
-- Created: 2024-01-01

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    country VARCHAR(2),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    market_demand_score INTEGER DEFAULT 0,
    growth_rate DECIMAL(5,2) DEFAULT 0,
    avg_salary DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User skills table
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    experience_years DECIMAL(3,1) DEFAULT 0,
    proficiency_level VARCHAR(20) DEFAULT 'beginner',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

-- Resumes table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    file_type VARCHAR(100),
    processing_status VARCHAR(20) DEFAULT 'PENDING',
    extracted_text TEXT,
    structured_data JSONB,
    error_message TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE,
    title VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    location VARCHAR(255),
    employment_type TEXT[],
    remote BOOLEAN DEFAULT false,
    description TEXT,
    requirements TEXT,
    benefits TEXT[],
    skills TEXT[],
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    application_url VARCHAR(500),
    date_posted TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User job matches table
CREATE TABLE IF NOT EXISTS user_job_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2),
    viewed BOOLEAN DEFAULT false,
    applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(processing_status);
CREATE INDEX IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at);

CREATE INDEX IF NOT EXISTS idx_jobs_external_id ON jobs(external_id);
CREATE INDEX IF NOT EXISTS idx_jobs_date_posted ON jobs(date_posted);
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs USING GIN(employment_type);

CREATE INDEX IF NOT EXISTS idx_user_job_matches_user_id ON user_job_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_matches_job_id ON user_job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_user_job_matches_score ON user_job_matches(match_score);






