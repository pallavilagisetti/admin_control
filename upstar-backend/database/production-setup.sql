-- Production Database Setup Script
-- This script sets up the production database with optimized settings

-- Create production database
CREATE DATABASE upstar_production
    WITH 
    OWNER = upstar_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to production database
\c upstar_production;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create optimized indexes for production
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_status ON resumes(processing_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_uploaded_at ON resumes(uploaded_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_remote ON jobs(remote);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);

-- Create partial indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_recent 
ON users(created_at) WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_processed 
ON resumes(processed_at) WHERE processing_status = 'completed';

-- Create GIN indexes for full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_text_search 
ON resumes USING gin(to_tsvector('english', extracted_text));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_text_search 
ON jobs USING gin(to_tsvector('english', title || ' ' || description));

-- Set up connection limits and timeouts
ALTER DATABASE upstar_production SET statement_timeout = '30s';
ALTER DATABASE upstar_production SET idle_in_transaction_session_timeout = '5min';
ALTER DATABASE upstar_production SET lock_timeout = '10s';

-- Create monitoring views
CREATE OR REPLACE VIEW api_performance_summary AS
SELECT 
    endpoint,
    method,
    COUNT(*) as request_count,
    AVG(response_time) as avg_response_time,
    MAX(response_time) as max_response_time,
    MIN(response_time) as min_response_time,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count
FROM api_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method
ORDER BY request_count DESC;

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_users,
    COUNT(*) FILTER (WHERE active = true) as active_users
FROM users 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE OR REPLACE VIEW system_health_metrics AS
SELECT 
    'database_size' as metric,
    pg_size_pretty(pg_database_size('upstar_production')) as value
UNION ALL
SELECT 
    'total_users' as metric,
    COUNT(*)::text as value
FROM users
UNION ALL
SELECT 
    'active_users' as metric,
    COUNT(*)::text as value
FROM users WHERE active = true
UNION ALL
SELECT 
    'total_resumes' as metric,
    COUNT(*)::text as value
FROM resumes
UNION ALL
SELECT 
    'processed_resumes' as metric,
    COUNT(*)::text as value
FROM resumes WHERE processing_status = 'completed';

-- Create functions for maintenance
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete API logs older than 30 days
    DELETE FROM api_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete error logs older than 90 days
    DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete audit logs older than 1 year
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Create function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE(
    table_name text,
    row_count bigint,
    table_size text,
    index_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins - n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO upstar_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO upstar_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO upstar_user;

-- Create maintenance user for automated tasks
CREATE USER maintenance_user WITH PASSWORD 'maintenance_password';
GRANT CONNECT ON DATABASE upstar_production TO maintenance_user;
GRANT USAGE ON SCHEMA public TO maintenance_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO maintenance_user;
GRANT EXECUTE ON FUNCTION cleanup_old_logs() TO maintenance_user;
GRANT EXECUTE ON FUNCTION get_database_stats() TO maintenance_user;

-- Set up automated maintenance (requires pg_cron extension)
-- Note: This requires superuser privileges to install pg_cron
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');

-- Create backup script
CREATE OR REPLACE FUNCTION create_backup_info()
RETURNS TABLE(
    backup_timestamp timestamp,
    database_size text,
    table_count integer,
    total_rows bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        NOW() as backup_timestamp,
        pg_size_pretty(pg_database_size('upstar_production')) as database_size,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::integer as table_count,
        (SELECT SUM(n_tup_ins - n_tup_del) FROM pg_stat_user_tables) as total_rows;
END;
$$ LANGUAGE plpgsql;

-- Final optimizations
ANALYZE;
VACUUM;



