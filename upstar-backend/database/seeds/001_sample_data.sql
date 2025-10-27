-- Seed: 001_sample_data.sql
-- Description: Sample data for development and testing
-- Created: 2024-01-01

-- Insert sample users
INSERT INTO users (id, email, name, roles, subscription_tier, active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@upstar.com', 'Admin User', ARRAY['admin'], 'enterprise', true, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', 'moderator@upstar.com', 'Moderator User', ARRAY['moderator'], 'pro', true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440003', 'user@upstar.com', 'Regular User', ARRAY['user'], 'free', true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440004', 'premium@upstar.com', 'Premium User', ARRAY['user'], 'pro', true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440005', 'inactive@upstar.com', 'Inactive User', ARRAY['user'], 'free', false, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

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
('DevOps', 'Infrastructure', 86, 24.6, 115000),
('TypeScript', 'Programming Languages', 91, 19.3, 98000),
('Vue.js', 'Frontend Frameworks', 83, 17.5, 92000),
('Angular', 'Frontend Frameworks', 79, 14.2, 95000),
('MongoDB', 'Databases', 84, 16.7, 89000),
('PostgreSQL', 'Databases', 88, 15.9, 92000),
('Redis', 'Databases', 81, 18.4, 87000),
('Kubernetes', 'DevOps', 89, 31.2, 118000),
('Terraform', 'DevOps', 85, 26.8, 112000),
('GraphQL', 'Backend Technologies', 87, 23.1, 96000),
('REST API', 'Backend Technologies', 93, 11.5, 88000)
ON CONFLICT (name) DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (external_id, title, organization, location, employment_type, remote, description, skills, salary_min, salary_max, salary_currency, date_posted, created_at) VALUES
('job_001', 'Senior Software Engineer', 'Tech Corp', 'San Francisco, CA', ARRAY['FULL_TIME'], true, 'We are looking for a senior software engineer to join our team...', ARRAY['JavaScript', 'React', 'Node.js', 'AWS'], 120000, 180000, 'USD', NOW() - INTERVAL '1 day', NOW()),
('job_002', 'Full Stack Developer', 'StartupXYZ', 'New York, NY', ARRAY['FULL_TIME'], false, 'Join our fast-growing startup as a full stack developer...', ARRAY['Python', 'Django', 'React', 'PostgreSQL'], 90000, 130000, 'USD', NOW() - INTERVAL '2 days', NOW()),
('job_003', 'DevOps Engineer', 'CloudTech', 'Seattle, WA', ARRAY['FULL_TIME'], true, 'We need a DevOps engineer to help us scale our infrastructure...', ARRAY['AWS', 'Docker', 'Kubernetes', 'Terraform'], 110000, 160000, 'USD', NOW() - INTERVAL '3 days', NOW()),
('job_004', 'Data Scientist', 'DataCorp', 'Boston, MA', ARRAY['FULL_TIME'], false, 'Join our data science team to build ML models...', ARRAY['Python', 'Machine Learning', 'SQL', 'TensorFlow'], 100000, 150000, 'USD', NOW() - INTERVAL '4 days', NOW()),
('job_005', 'Frontend Developer', 'WebAgency', 'Austin, TX', ARRAY['FULL_TIME'], true, 'We are looking for a talented frontend developer...', ARRAY['JavaScript', 'React', 'TypeScript', 'CSS'], 80000, 120000, 'USD', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (external_id) DO NOTHING;

-- Insert sample resumes
INSERT INTO resumes (id, user_id, filename, processing_status, extracted_text, structured_data, uploaded_at, processed_at) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440003', 'john_doe_resume.pdf', 'COMPLETED', 'John Doe - Software Engineer with 5 years of experience in JavaScript, React, and Node.js...', '{"skills": ["JavaScript", "React", "Node.js", "Python", "SQL"], "education": "Bachelor of Computer Science", "experience": "5 years of software development experience", "summary": "Experienced full-stack developer with expertise in modern web technologies"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440004', 'jane_smith_resume.pdf', 'COMPLETED', 'Jane Smith - Data Scientist with expertise in Python, Machine Learning, and SQL...', '{"skills": ["Python", "Machine Learning", "SQL", "TensorFlow", "Pandas"], "education": "Master of Data Science", "experience": "3 years of data science experience", "summary": "Experienced data scientist with strong background in machine learning and statistical analysis"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'john_doe_resume_v2.pdf', 'PROCESSING', 'Updated resume with new skills and experience...', NULL, NOW() - INTERVAL '1 hour', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample user skills
INSERT INTO user_skills (user_id, skill_id, experience_years, proficiency_level) VALUES
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM skills WHERE name = 'JavaScript'), 5.0, 'expert'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM skills WHERE name = 'React'), 4.0, 'advanced'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM skills WHERE name = 'Node.js'), 3.5, 'intermediate'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM skills WHERE name = 'Python'), 2.0, 'beginner'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM skills WHERE name = 'SQL'), 4.5, 'advanced'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM skills WHERE name = 'Python'), 4.0, 'expert'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM skills WHERE name = 'Machine Learning'), 3.0, 'advanced'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM skills WHERE name = 'SQL'), 5.0, 'expert'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM skills WHERE name = 'Data Science'), 3.5, 'intermediate')
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- Insert sample user job matches
INSERT INTO user_job_matches (user_id, job_id, match_score, viewed, applied, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM jobs WHERE external_id = 'job_001'), 85.5, true, false, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM jobs WHERE external_id = 'job_002'), 72.3, false, false, NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM jobs WHERE external_id = 'job_005'), 78.9, true, true, NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440004', (SELECT id FROM jobs WHERE external_id = 'job_004'), 92.1, true, false, NOW() - INTERVAL '1 day')
ON CONFLICT (user_id, job_id) DO NOTHING;






