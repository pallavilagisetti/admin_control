-- Upstar Backend Database Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
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
CREATE TABLE skills (
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
CREATE TABLE user_skills (
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
CREATE TABLE resumes (
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
CREATE TABLE jobs (
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
CREATE TABLE user_job_matches (
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

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    amount DECIMAL(10,2),
    next_billing_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    type VARCHAR(20) NOT NULL,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Refunds table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id),
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Settings table
CREATE TABLE ai_settings (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(10,4) NOT NULL,
    type VARCHAR(50) DEFAULT 'slider',
    category VARCHAR(100),
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    step DECIMAL(10,4),
    options JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Models table
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive',
    accuracy DECIMAL(5,2),
    latency_ms INTEGER,
    cost_per_request DECIMAL(10,6),
    version VARCHAR(50),
    endpoint_url VARCHAR(500),
    last_updated TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Requests table
CREATE TABLE ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ai_models(id),
    user_id UUID REFERENCES users(id),
    request_data JSONB,
    response_data JSONB,
    processing_time INTEGER,
    cost DECIMAL(10,6),
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Model Tests table
CREATE TABLE ai_model_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ai_models(id),
    test_data TEXT,
    processing_time INTEGER,
    confidence DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(20) NOT NULL,
    audience VARCHAR(50) NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notification Reminders table
CREATE TABLE notification_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cadence VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification Templates table
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    variables TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- CMS Articles table
CREATE TABLE cms_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    category VARCHAR(100),
    tags TEXT[],
    author VARCHAR(255),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System Health tables
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'info',
    status VARCHAR(20) DEFAULT 'active',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE TABLE system_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'low',
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE TABLE system_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    network_throughput DECIMAL(10,2),
    network_latency DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics tables
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    response_time INTEGER,
    status_code INTEGER,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_duration_minutes INTEGER,
    retention_rate DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    click_through_rate DECIMAL(5,2),
    application_rate DECIMAL(5,2),
    interview_success_rate DECIMAL(5,2),
    match_accuracy DECIMAL(5,2),
    click_through_rate_change DECIMAL(5,2),
    application_rate_change DECIMAL(5,2),
    interview_success_rate_change DECIMAL(5,2),
    match_accuracy_change DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversion_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversion_rate DECIMAL(5,2),
    conversion_rate_change DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE churn_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    churn_rate DECIMAL(5,2),
    churn_rate_change DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Background Jobs tables
CREATE TABLE job_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    jobs_added INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE resume_processing_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES resumes(id),
    user_id UUID REFERENCES users(id),
    error_message TEXT,
    error_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE analytics_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_roles ON users USING GIN(roles);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(processing_status);
CREATE INDEX idx_resumes_uploaded_at ON resumes(uploaded_at);

CREATE INDEX idx_jobs_external_id ON jobs(external_id);
CREATE INDEX idx_jobs_date_posted ON jobs(date_posted);
CREATE INDEX idx_jobs_skills ON jobs USING GIN(skills);
CREATE INDEX idx_jobs_employment_type ON jobs USING GIN(employment_type);

CREATE INDEX idx_user_job_matches_user_id ON user_job_matches(user_id);
CREATE INDEX idx_user_job_matches_job_id ON user_job_matches(job_id);
CREATE INDEX idx_user_job_matches_score ON user_job_matches(match_score);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_cms_articles_status ON cms_articles(status);
CREATE INDEX idx_cms_articles_category ON cms_articles(category);
CREATE INDEX idx_cms_articles_slug ON cms_articles(slug);

CREATE INDEX idx_system_alerts_status ON system_alerts(status);
CREATE INDEX idx_system_alerts_severity ON system_alerts(severity);

CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- Insert default AI settings
INSERT INTO ai_settings (id, name, description, value, type, category, min_value, max_value, step) VALUES
('confidence_threshold', 'Confidence Threshold', 'Minimum confidence score for AI predictions', 0.85, 'slider', 'Prediction', 0.0, 1.0, 0.01),
('processing_timeout', 'Processing Timeout', 'Maximum processing time in seconds', 300, 'slider', 'Performance', 60, 600, 10),
('max_retries', 'Max Retries', 'Maximum number of retry attempts', 3, 'slider', 'Reliability', 1, 10, 1),
('batch_size', 'Batch Size', 'Number of items to process in a batch', 10, 'slider', 'Performance', 1, 100, 1);

-- Insert default AI models
INSERT INTO ai_models (id, name, status, accuracy, latency_ms, cost_per_request, version, endpoint_url) VALUES
(uuid_generate_v4(), 'GPT-4', 'active', 94.2, 1200, 0.03, '1.0', 'https://api.openai.com/v1/chat/completions'),
(uuid_generate_v4(), 'GPT-3.5-turbo', 'active', 89.5, 800, 0.002, '1.0', 'https://api.openai.com/v1/chat/completions'),
(uuid_generate_v4(), 'Claude-3', 'inactive', 92.1, 1500, 0.025, '1.0', 'https://api.anthropic.com/v1/messages');

-- Insert default notification templates
INSERT INTO notification_templates (id, name, subject, content, type, variables) VALUES
(uuid_generate_v4(), 'Welcome Email', 'Welcome to Upstar!', 'Welcome to Upstar! We are excited to have you on board.', 'email', ARRAY['user_name', 'company_name']),
(uuid_generate_v4(), 'Job Match Alert', 'New Job Matches Found', 'We found {{match_count}} new job matches for you!', 'email', ARRAY['user_name', 'match_count', 'job_titles']),
(uuid_generate_v4(), 'Resume Processed', 'Your Resume Has Been Processed', 'Your resume has been successfully processed and analyzed.', 'email', ARRAY['user_name', 'skills_found']);

-- Insert default notification reminders
INSERT INTO notification_reminders (id, title, description, cadence, enabled) VALUES
(uuid_generate_v4(), 'Interview Reminder', 'Sent 3 days before scheduled interviews', 'Event-based', true),
(uuid_generate_v4(), 'Weekly Job Digest', 'Weekly summary of new job opportunities', 'Weekly', true),
(uuid_generate_v4(), 'Profile Completion', 'Remind users to complete their profiles', 'Daily', true);

-- Insert sample skills
INSERT INTO skills (name, category, market_demand_score, growth_rate, avg_salary) VALUES
('JavaScript', 'Programming Languages', 95, 15.2, 95000),
('Python', 'Programming Languages', 92, 18.5, 105000),
('React', 'Frontend Frameworks', 88, 22.1, 98000),
('Node.js', 'Backend Technologies', 85, 16.8, 92000),
('SQL', 'Databases', 90, 12.3, 88000),
('AWS', 'Cloud Platforms', 87, 25.4, 110000),
('Docker', 'DevOps', 82, 28.7, 102000),
('Machine Learning', 'AI/ML', 94, 35.2, 125000),
('Data Science', 'Analytics', 89, 20.1, 108000),
('DevOps', 'Infrastructure', 86, 24.6, 115000);