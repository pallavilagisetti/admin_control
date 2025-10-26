# Upstar Backend Database Documentation

## Overview
This document provides a comprehensive overview of the existing Upstar backend database schema, including all 27 tables, their fields, data types, relationships, and constraints.

## Database Configuration
- **Database**: PostgreSQL 16
- **Port**: 5433
- **Host**: localhost
- **Database Name**: resume_db
- **User**: postgres
- **Password**: localpass

## Custom Data Types (Enums)

| Type | Values | Description |
|------|--------|-------------|
| `usertier` | free, paid | User subscription tier |
| `proficiencylevel` | BEGINNER, INTERMEDIATE, ADVANCED, EXPERT | Skill proficiency levels |
| `processingstatus` | PENDING, PROCESSING, COMPLETED, FAILED | File processing status |
| `employmenttype` | Various employment types | Job employment types |
| `experience_level_enum` | Various experience levels | Experience level categories |
| `jobsource` | Various job sources | Job posting sources |
| `role_fit_enum` | Various role fit categories | Role matching categories |
| `userjobaction` | Various user actions | User interaction with jobs |

## Core Tables

### 1. Users Table
**Purpose**: Stores user account information with Auth0 integration

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `auth0_sub` | VARCHAR(255) | UNIQUE, NOT NULL | Auth0 subject identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `picture` | VARCHAR(500) | NULL | Profile picture URL |
| `email_verified` | BOOLEAN | NULL | Email verification status |
| `user_metadata` | JSON | NULL | Additional user metadata |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Account creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |
| `tier` | usertier | NOT NULL, DEFAULT 'free' | User subscription tier |

**Indexes:**
- `users_pkey` - Primary key
- `ix_users_auth0_sub` - Auth0 subject lookup
- `ix_users_email` - Email lookup
- `ix_users_id` - ID lookup

### 2. Resumes Table
**Purpose**: Stores user resume files and processing information

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique resume identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Resume owner |
| `filename` | VARCHAR(255) | NOT NULL | Original filename |
| `file_size` | INTEGER | NOT NULL | File size in bytes |
| `file_type` | VARCHAR(100) | NOT NULL | MIME type |
| `s3_key` | VARCHAR(500) | UNIQUE, NOT NULL | S3 storage key |
| `s3_bucket` | VARCHAR(100) | NOT NULL | S3 bucket name |
| `processing_status` | processingstatus | NOT NULL | Processing status |
| `extracted_text` | TEXT | NULL | Extracted text content |
| `structured_data` | JSON | NULL | Structured resume data |
| `error_message` | TEXT | NULL | Processing error message |
| `uploaded_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Upload time |
| `processed_at` | TIMESTAMP WITH TIME ZONE | NULL | Processing completion time |

**Indexes:**
- `resumes_pkey` - Primary key
- `ix_resumes_processing_status` - Status filtering
- `ix_resumes_s3_key` - S3 key lookup
- `ix_resumes_user_id` - User's resumes

**Relationships:**
- **Many-to-One** with Users table (user_id → users.id)

### 3. Skills Table
**Purpose**: Stores extracted skills from resumes with proficiency levels

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique skill identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Skill owner |
| `resume_id` | UUID | NOT NULL, REFERENCES resumes(id) ON DELETE CASCADE | Source resume |
| `skill_name` | VARCHAR(100) | NOT NULL | Skill name |
| `skill_category` | VARCHAR(100) | NULL | Skill category |
| `proficiency_level` | proficiencylevel | NOT NULL | Skill proficiency |
| `years_experience` | DOUBLE PRECISION | NULL | Years of experience |
| `is_verified` | BOOLEAN | NOT NULL | Verification status |
| `confidence_score` | NUMERIC(5,4) | NOT NULL | AI confidence score |
| `extraction_metadata` | JSON | NULL | Extraction metadata |
| `extracted_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Extraction time |

**Constraints:**
- `uq_skills_resume_skill` - Unique skill per resume

**Indexes:**
- `skills_pkey` - Primary key
- `ix_skills_proficiency_level` - Proficiency filtering
- `ix_skills_resume_id` - Resume skills
- `ix_skills_skill_category` - Category filtering
- `ix_skills_skill_name` - Skill name lookup
- `ix_skills_user_id` - User skills

**Relationships:**
- **Many-to-One** with Users table (user_id → users.id)
- **Many-to-One** with Resumes table (resume_id → resumes.id)

### 4. Work Experience Table
**Purpose**: Stores extracted work experience from resumes

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique experience identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Experience owner |
| `resume_id` | UUID | NOT NULL, REFERENCES resumes(id) ON DELETE CASCADE | Source resume |
| `company_name` | VARCHAR(255) | NOT NULL | Company name |
| `job_title` | VARCHAR(255) | NOT NULL | Job title |
| `start_date` | DATE | NOT NULL | Start date |
| `end_date` | DATE | NULL | End date |
| `is_current` | BOOLEAN | NOT NULL | Current job status |
| `description` | TEXT | NULL | Job description |
| `skills_used` | JSON | NULL | Skills used in role |
| `achievements` | JSON | NULL | Achievements |
| `location` | VARCHAR(255) | NULL | Job location |
| `employment_type` | employmenttype | NOT NULL | Employment type |
| `extraction_metadata` | JSON | NULL | Extraction metadata |
| `extracted_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Extraction time |

**Indexes:**
- `work_experience_pkey` - Primary key
- `ix_work_experience_company_name` - Company lookup
- `ix_work_experience_employment_type` - Employment type filtering
- `ix_work_experience_is_current` - Current job filtering
- `ix_work_experience_job_title` - Job title lookup
- `ix_work_experience_resume_id` - Resume experiences
- `ix_work_experience_user_id` - User experiences

**Relationships:**
- **Many-to-One** with Users table (user_id → users.id)
- **Many-to-One** with Resumes table (resume_id → resumes.id)

### 5. Job Listings Table
**Purpose**: Stores job postings from various sources

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | VARCHAR(255) | PRIMARY KEY | External job ID |
| `title` | TEXT | NOT NULL | Job title |
| `organization` | TEXT | NOT NULL | Company name |
| `organization_url` | TEXT | NULL | Company website |
| `organization_logo` | TEXT | NULL | Company logo URL |
| `date_posted` | TIMESTAMP WITH TIME ZONE | NULL | Job posting date |
| `date_created` | TIMESTAMP WITH TIME ZONE | NULL | Job creation date |
| `date_valid_through` | TIMESTAMP WITH TIME ZONE | NULL | Job expiration date |
| `date_modified` | TIMESTAMP WITH TIME ZONE | NULL | Last modification date |
| `employment_type` | TEXT[] | NULL | Employment types array |
| `location_type` | TEXT | NULL | Location type |
| `remote_derived` | BOOLEAN | NOT NULL | Remote work availability |
| `url` | TEXT | NULL | Job posting URL |
| `source` | TEXT | NULL | Job source |
| `source_type` | TEXT | NULL | Source type |
| `source_domain` | TEXT | NULL | Source domain |
| `description_text` | TEXT | NULL | Job description text |
| `description_html` | TEXT | NULL | Job description HTML |
| `salary_raw` | JSONB | NULL | Raw salary data |
| `ai_salary_currency` | TEXT | NULL | AI-extracted currency |
| `ai_salary_value` | NUMERIC | NULL | AI-extracted salary |
| `ai_salary_minvalue` | NUMERIC | NULL | AI-extracted min salary |
| `ai_salary_maxvalue` | NUMERIC | NULL | AI-extracted max salary |
| `ai_salary_unittext` | TEXT | NULL | Salary unit text |
| `ai_key_skills` | TEXT[] | NULL | AI-extracted key skills |
| `ai_employment_type` | TEXT[] | NULL | AI-extracted employment types |
| `ai_experience_level` | TEXT | NULL | AI-extracted experience level |
| `ai_work_arrangement` | TEXT | NULL | AI-extracted work arrangement |
| `ai_work_arrangement_office_days` | INTEGER | NULL | Office days per week |
| `ai_visa_sponsorship` | BOOLEAN | NULL | Visa sponsorship availability |
| `ai_benefits` | TEXT[] | NULL | AI-extracted benefits |
| `ai_core_responsibilities` | TEXT | NULL | AI-extracted responsibilities |
| `ai_requirements_summary` | TEXT | NULL | AI-extracted requirements |
| `ai_working_hours` | INTEGER | NULL | AI-extracted working hours |
| `linkedin_org_employees` | INTEGER | NULL | LinkedIn company employee count |
| `linkedin_org_industry` | TEXT | NULL | LinkedIn company industry |
| `linkedin_org_slug` | TEXT | NULL | LinkedIn company slug |
| `linkedin_org_size` | TEXT | NULL | LinkedIn company size |
| `linkedin_org_headquarters` | TEXT | NULL | LinkedIn company headquarters |
| `linkedin_org_type` | TEXT | NULL | LinkedIn company type |
| `linkedin_org_followers` | INTEGER | NULL | LinkedIn company followers |
| `linkedin_org_description` | TEXT | NULL | LinkedIn company description |
| `raw_data` | JSONB | NULL | Raw job data |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Record creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |
| `data_source` | VARCHAR(50) | NULL | Data source identifier |

**Indexes:**
- `job_listings_pkey` - Primary key
- `idx_job_listings_ai_experience_level` - Experience level filtering
- `idx_job_listings_data_source` - Data source filtering
- `idx_job_listings_date_posted` - Date filtering
- `idx_job_listings_description_gin` - Full-text search on description
- `idx_job_listings_employment_type_gin` - Employment type filtering
- `idx_job_listings_organization` - Organization filtering
- `idx_job_listings_remote` - Remote work filtering
- `idx_job_listings_skills_gin` - Skills filtering
- `idx_job_listings_source` - Source filtering
- `idx_job_listings_title_gin` - Full-text search on title

### 6. Matched Jobs Table
**Purpose**: Stores job matches for users based on their profiles

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique match identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User who received match |
| `resume_id` | UUID | NOT NULL, REFERENCES resumes(id) ON DELETE CASCADE | Resume used for matching |
| `job_source` | jobsource | NOT NULL | Source of the job |
| `external_job_id` | VARCHAR(255) | NOT NULL | External job identifier |
| `title` | VARCHAR(500) | NOT NULL | Job title |
| `company` | VARCHAR(255) | NOT NULL | Company name |
| `company_logo_url` | VARCHAR(1000) | NULL | Company logo URL |
| `location` | VARCHAR(255) | NULL | Job location |
| `is_remote` | BOOLEAN | NOT NULL | Remote work availability |
| `description` | TEXT | NULL | Job description |
| `qualifications` | TEXT | NULL | Job qualifications |
| `salary_min` | INTEGER | NULL | Minimum salary |
| `salary_max` | INTEGER | NULL | Maximum salary |
| `salary_currency` | VARCHAR(10) | NULL | Salary currency |
| `employment_type` | employmenttype | NULL | Employment type |
| `posted_date` | TIMESTAMP WITH TIME ZONE | NULL | Job posting date |
| `application_url` | VARCHAR(1000) | NULL | Application URL |
| `match_score` | NUMERIC(5,2) | NOT NULL | Match score (0-100) |
| `match_reasons` | JSON | NOT NULL | Reasons for match |
| `skills_matched` | VARCHAR[] | NOT NULL | Matched skills |
| `skills_missing` | VARCHAR[] | NOT NULL | Missing skills |
| `user_action` | userjobaction | NULL | User action on job |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Match creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |

**Indexes:**
- `matched_jobs_pkey` - Primary key
- `ix_matched_jobs_company` - Company filtering
- `ix_matched_jobs_created_at` - Date filtering
- `ix_matched_jobs_external_job_id` - External job lookup
- `ix_matched_jobs_is_remote` - Remote work filtering
- `ix_matched_jobs_job_source` - Source filtering
- `ix_matched_jobs_match_score` - Score filtering
- `ix_matched_jobs_resume_id` - Resume matches
- `ix_matched_jobs_user_action` - User action filtering
- `ix_matched_jobs_user_id` - User matches

**Relationships:**
- **Many-to-One** with Users table (user_id → users.id)
- **Many-to-One** with Resumes table (resume_id → resumes.id)

### 7. Profile Assessments Table
**Purpose**: Stores AI-generated profile assessments and scores

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique assessment identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Assessment owner |
| `resume_id` | UUID | NOT NULL, REFERENCES resumes(id) ON DELETE CASCADE | Source resume |
| `profile_score` | NUMERIC(5,2) | NOT NULL | Overall profile score |
| `completeness_score` | NUMERIC(5,2) | NOT NULL | Profile completeness score |
| `detail_depth_score` | NUMERIC(5,2) | NOT NULL | Detail depth score |
| `recency_score` | NUMERIC(5,2) | NOT NULL | Information recency score |
| `polish_score` | NUMERIC(5,2) | NOT NULL | Profile polish score |
| `experience_level` | experience_level_enum | NOT NULL | Experience level |
| `total_years_experience` | DOUBLE PRECISION | NOT NULL | Total years of experience |
| `years_score` | NUMERIC(3,2) | NOT NULL | Years experience score |
| `seniority_score` | NUMERIC(3,2) | NOT NULL | Seniority score |
| `progression_score` | NUMERIC(3,2) | NOT NULL | Career progression score |
| `role_fit` | role_fit_enum | NOT NULL | Role fit category |
| `role_fit_score` | NUMERIC(3,2) | NOT NULL | Role fit score |
| `target_role_title` | VARCHAR(255) | NULL | Target role title |
| `target_career_path` | VARCHAR(255) | NULL | Target career path |
| `skills_fit` | NUMERIC(3,2) | NULL | Skills fit score |
| `experience_fit` | NUMERIC(3,2) | NULL | Experience fit score |
| `education_fit` | NUMERIC(3,2) | NULL | Education fit score |
| `trajectory_fit` | NUMERIC(3,2) | NULL | Career trajectory fit score |
| `star_badge` | VARCHAR(50) | NOT NULL | Star badge earned |
| `confidence` | NUMERIC(3,2) | NOT NULL | Assessment confidence |
| `assessment_metadata` | JSON | NULL | Additional assessment data |
| `calculated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Assessment calculation time |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Assessment creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |
| `ai_insight` | TEXT | NULL | AI-generated insight |
| `ai_insight_generated_at` | TIMESTAMP WITH TIME ZONE | NULL | Insight generation time |

**Indexes:**
- `profile_assessments_pkey` - Primary key
- `ix_profile_assessments_experience_level` - Experience level filtering
- `ix_profile_assessments_resume_id` - Resume assessments
- `ix_profile_assessments_role_fit` - Role fit filtering
- `ix_profile_assessments_user_id` - User assessments

**Relationships:**
- **Many-to-One** with Users table (user_id → users.id)
- **Many-to-One** with Resumes table (resume_id → resumes.id)

### 8. Learning Recommendations Table
**Purpose**: Stores AI-generated learning recommendations for users

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique recommendation identifier |
| `user_id` | UUID | UNIQUE, NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Recommendation owner |
| `recommended_courses` | JSON | NOT NULL | Recommended courses |
| `learning_paths` | JSON | NOT NULL | Learning paths |
| `trending_insights` | JSON | NOT NULL | Trending insights |
| `generation_context` | JSON | NULL | Generation context |
| `ai_model` | VARCHAR(50) | NOT NULL, DEFAULT 'gpt-4o' | AI model used |
| `generation_prompt_hash` | VARCHAR(64) | NULL | Prompt hash for caching |
| `generated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Generation time |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |

**Constraints:**
- `uq_learning_recommendations_user_id` - One recommendation per user

**Indexes:**
- `learning_recommendations_pkey` - Primary key
- `ix_learning_recommendations_generated_at` - Generation date filtering
- `ix_learning_recommendations_user_id` - User recommendations

**Relationships:**
- **One-to-One** with Users table (user_id → users.id)

## Supporting Tables

### 9. Job Locations Table
**Purpose**: Links jobs to geographic locations

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique location identifier |
| `job_id` | VARCHAR(255) | NOT NULL, REFERENCES job_listings(id) ON DELETE CASCADE | Job identifier |
| `city_id` | UUID | NULL, REFERENCES job_cities(id) ON DELETE CASCADE | City identifier |
| `region_id` | UUID | NULL, REFERENCES job_regions(id) ON DELETE CASCADE | Region identifier |
| `country_id` | UUID | NOT NULL, REFERENCES job_countries(id) ON DELETE CASCADE | Country identifier |
| `location_string` | TEXT | NULL | Location as string |

**Constraints:**
- `uq_job_location` - Unique location per job

**Indexes:**
- `job_locations_pkey` - Primary key
- `idx_job_locations_city` - City filtering
- `idx_job_locations_country` - Country filtering
- `idx_job_locations_job` - Job lookup
- `idx_job_locations_region` - Region filtering

### 10. Job Cities Table
**Purpose**: Stores city information for job locations

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique city identifier |
| `name` | VARCHAR(255) | NOT NULL | City name |
| `region_id` | UUID | NULL, REFERENCES job_regions(id) ON DELETE CASCADE | Region identifier |
| `country_id` | UUID | NOT NULL, REFERENCES job_countries(id) ON DELETE CASCADE | Country identifier |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |

**Constraints:**
- `uq_city_region_country` - Unique city per region/country

**Indexes:**
- `job_cities_pkey` - Primary key
- `idx_job_cities_country` - Country filtering
- `idx_job_cities_region` - Region filtering

### 11. Job Countries Table
**Purpose**: Stores country information for job locations

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique country identifier |
| `name` | VARCHAR(255) | NOT NULL | Country name |
| `code` | VARCHAR(3) | NULL | Country code |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |

### 12. Job Regions Table
**Purpose**: Stores region/state information for job locations

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique region identifier |
| `name` | VARCHAR(255) | NOT NULL | Region name |
| `country_id` | UUID | NOT NULL, REFERENCES job_countries(id) ON DELETE CASCADE | Country identifier |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |

### 13. Career Paths Table
**Purpose**: Stores predefined career paths

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique career path identifier |
| `name` | VARCHAR(255) | UNIQUE, NOT NULL | Career path name |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| `description` | TEXT | NULL | Career path description |
| `category` | VARCHAR(100) | NULL | Career path category |
| `display_order` | INTEGER | NOT NULL | Display order |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |

**Indexes:**
- `career_paths_pkey` - Primary key
- `ix_career_paths_category` - Category filtering
- `ix_career_paths_name` - Name lookup
- `ix_career_paths_slug` - Slug lookup

### 14. Target Roles Table
**Purpose**: Stores target roles for career planning

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique role identifier |
| `title` | VARCHAR(255) | NOT NULL | Role title |
| `description` | TEXT | NULL | Role description |
| `career_path_id` | UUID | NULL, REFERENCES career_paths(id) ON DELETE SET NULL | Career path |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |

### 15. Static Courses Table
**Purpose**: Stores course information for learning recommendations

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique course identifier |
| `title` | VARCHAR(255) | NOT NULL | Course title |
| `description` | TEXT | NULL | Course description |
| `provider` | VARCHAR(255) | NULL | Course provider |
| `url` | VARCHAR(500) | NULL | Course URL |
| `difficulty` | difficultylevel | NULL | Course difficulty |
| `duration_hours` | INTEGER | NULL | Course duration |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |

### 16. LLM Models Table
**Purpose**: Stores AI model information

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique model identifier |
| `name` | VARCHAR(100) | NOT NULL | Model name |
| `provider_id` | UUID | NOT NULL, REFERENCES llm_providers(id) ON DELETE CASCADE | Provider identifier |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Model availability |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |

### 17. LLM Providers Table
**Purpose**: Stores AI provider information

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique provider identifier |
| `name` | VARCHAR(100) | NOT NULL | Provider name |
| `api_base_url` | VARCHAR(500) | NULL | API base URL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Provider availability |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |

### 18. LLM Usage Logs Table
**Purpose**: Tracks AI model usage and costs

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique log identifier |
| `user_id` | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL | User who made request |
| `operation_name` | VARCHAR(100) | NULL | Operation performed |
| `model_id` | UUID | NULL, REFERENCES llm_models(id) ON DELETE SET NULL | Model used |
| `provider_name` | VARCHAR(50) | NULL | Provider name |
| `prompt_tokens` | INTEGER | NULL | Input tokens used |
| `completion_tokens` | INTEGER | NULL | Output tokens generated |
| `total_tokens` | INTEGER | NULL | Total tokens used |
| `cost_usd` | NUMERIC(10,6) | NULL | Cost in USD |
| `latency_ms` | INTEGER | NULL | Request latency |
| `success` | BOOLEAN | NOT NULL | Request success status |
| `error_message` | TEXT | NULL | Error message if failed |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Request time |

**Indexes:**
- `llm_usage_logs_pkey` - Primary key
- `idx_usage_logs_model` - Model usage tracking
- `idx_usage_logs_operation` - Operation tracking
- `idx_usage_logs_user` - User usage tracking

### 19. Job Queue Table
**Purpose**: Manages background job processing

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique job identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Job owner |
| `resume_id` | UUID | NULL, REFERENCES resumes(id) ON DELETE CASCADE | Resume being processed |
| `job_type` | VARCHAR(100) | NOT NULL | Type of job |
| `status` | jobstatus | NOT NULL | Job status |
| `priority` | INTEGER | NOT NULL, DEFAULT 0 | Job priority |
| `payload` | JSON | NULL | Job data |
| `result` | JSON | NULL | Job result |
| `error_message` | TEXT | NULL | Error message |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Job creation time |
| `started_at` | TIMESTAMP WITH TIME ZONE | NULL | Job start time |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Job completion time |

### 20. Profile Shares Table
**Purpose**: Tracks profile sharing and visibility

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique share identifier |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | Profile owner |
| `profile_assessment_id` | UUID | NOT NULL, REFERENCES profile_assessments(id) ON DELETE CASCADE | Assessment shared |
| `share_token` | VARCHAR(255) | UNIQUE, NOT NULL | Share token |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Share status |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NULL | Share expiration |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Share creation time |

### 21. Referrals Table
**Purpose**: Tracks user referrals

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique referral identifier |
| `referring_user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | User who made referral |
| `referred_user_id` | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL | User who was referred |
| `referral_code` | VARCHAR(50) | NOT NULL | Referral code |
| `status` | referral_status_enum | NOT NULL | Referral status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Referral creation time |

### 22. API Usage Tracking Table
**Purpose**: Tracks API usage and rate limiting

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique tracking identifier |
| `user_id` | UUID | NULL, REFERENCES users(id) ON DELETE SET NULL | User making request |
| `endpoint` | VARCHAR(255) | NOT NULL | API endpoint |
| `method` | VARCHAR(10) | NOT NULL | HTTP method |
| `ip_address` | INET | NULL | Client IP address |
| `user_agent` | TEXT | NULL | User agent string |
| `response_time_ms` | INTEGER | NULL | Response time |
| `status_code` | INTEGER | NULL | HTTP status code |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Request time |

### 23. Sync Runs Table
**Purpose**: Tracks data synchronization runs

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique sync run identifier |
| `sync_type` | VARCHAR(100) | NOT NULL | Type of sync |
| `status` | VARCHAR(50) | NOT NULL | Sync status |
| `started_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Sync start time |
| `completed_at` | TIMESTAMP WITH TIME ZONE | NULL | Sync completion time |
| `records_processed` | INTEGER | NULL | Records processed |
| `records_created` | INTEGER | NULL | Records created |
| `records_updated` | INTEGER | NULL | Records updated |
| `error_message` | TEXT | NULL | Error message |
| `metadata` | JSON | NULL | Sync metadata |

### 24. Sync Cursors Table
**Purpose**: Stores synchronization cursors for incremental syncs

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique cursor identifier |
| `sync_type` | VARCHAR(100) | NOT NULL | Type of sync |
| `cursor_value` | VARCHAR(255) | NOT NULL | Cursor position |
| `last_sync_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Last sync time |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Cursor creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |

### 25. Scoring Weights Table
**Purpose**: Stores scoring weights for job matching algorithms

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique weight identifier |
| `weight_name` | VARCHAR(100) | NOT NULL | Weight name |
| `weight_value` | NUMERIC(5,4) | NOT NULL | Weight value |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Weight status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |

### 26. LLM Operation Configs Table
**Purpose**: Stores configuration for AI operations

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique config identifier |
| `operation_name` | VARCHAR(100) | NOT NULL | Operation name |
| `model_id` | UUID | NOT NULL, REFERENCES llm_models(id) ON DELETE CASCADE | Model to use |
| `config_json` | JSON | NOT NULL | Operation configuration |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Config status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT now() | Last update time |

### 27. Alembic Version Table
**Purpose**: Tracks database migration versions

| Field | Data Type | Constraints | Description |
|-------|-----------|-------------|-------------|
| `version_num` | VARCHAR(32) | PRIMARY KEY | Migration version number |

## Database Relationships

### Entity Relationship Diagram (ERD)

```
Users (1) ←→ (Many) Resumes
Users (1) ←→ (Many) Skills
Users (1) ←→ (Many) Work Experience
Users (1) ←→ (Many) Matched Jobs
Users (1) ←→ (Many) Profile Assessments
Users (1) ←→ (1) Learning Recommendations
Users (1) ←→ (Many) Job Queue
Users (1) ←→ (Many) Profile Shares
Users (1) ←→ (Many) Referrals
Users (1) ←→ (Many) API Usage Tracking
Users (1) ←→ (Many) LLM Usage Logs

Resumes (1) ←→ (Many) Skills
Resumes (1) ←→ (Many) Work Experience
Resumes (1) ←→ (Many) Matched Jobs
Resumes (1) ←→ (Many) Profile Assessments
Resumes (1) ←→ (Many) Job Queue

Job Listings (1) ←→ (Many) Job Locations
Job Listings (1) ←→ (Many) Matched Jobs

Job Locations (1) ←→ (Many) Job Cities
Job Locations (1) ←→ (Many) Job Regions
Job Locations (1) ←→ (Many) Job Countries

Career Paths (1) ←→ (Many) Target Roles

LLM Providers (1) ←→ (Many) LLM Models
LLM Models (1) ←→ (Many) LLM Usage Logs
LLM Models (1) ←→ (Many) LLM Operation Configs
```

### Core Relationships

1. **Users → Resumes**: One user can have many resumes
2. **Users → Skills**: One user can have many skills (extracted from resumes)
3. **Users → Work Experience**: One user can have many work experiences
4. **Users → Matched Jobs**: One user can receive many job matches
5. **Users → Profile Assessments**: One user can have many assessments
6. **Users → Learning Recommendations**: One user has one set of recommendations
7. **Resumes → Skills**: One resume can have many skills extracted
8. **Resumes → Work Experience**: One resume can have many work experiences
9. **Job Listings → Job Locations**: One job can have multiple locations
10. **Job Locations → Geographic Data**: Links to cities, regions, countries

## Key Features

### AI-Powered Resume Processing
- **Resume Upload**: Users upload resumes to S3 storage
- **Text Extraction**: AI extracts text and structured data
- **Skill Extraction**: AI identifies skills with proficiency levels
- **Work Experience**: AI extracts work history with achievements
- **Profile Assessment**: AI generates comprehensive profile scores

### Job Matching System
- **Job Listings**: Aggregated from multiple sources
- **AI Processing**: Jobs are processed with AI for skills, salary, etc.
- **Matching Algorithm**: Users get matched jobs based on profile
- **Scoring System**: Match scores with detailed reasons

### Learning & Career Development
- **Learning Recommendations**: AI-generated course suggestions
- **Career Paths**: Predefined career progression paths
- **Target Roles**: Specific roles users can target
- **Static Courses**: Course database for recommendations

### Analytics & Monitoring
- **LLM Usage Tracking**: Monitor AI model usage and costs
- **API Usage**: Track API calls and performance
- **Sync Operations**: Data synchronization monitoring
- **Job Queue**: Background job processing

## Database Functions and Triggers

### Auto-Update Trigger
Most tables have automatic `updated_at` timestamp updates:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## Performance Optimizations

1. **Strategic Indexes**: Optimized for common query patterns
2. **Full-Text Search**: GIN indexes for job descriptions and titles
3. **JSON Indexing**: Efficient JSONB operations
4. **Connection Pooling**: PostgreSQL connection pooling
5. **Query Optimization**: Efficient JOINs and filtering

## Security Features

1. **Auth0 Integration**: External authentication provider
2. **User Tiers**: Free and paid user tiers
3. **Data Privacy**: User data isolation
4. **API Rate Limiting**: Usage tracking and limits
5. **Secure File Storage**: S3 integration for resume files

## Database Maintenance

### Backup
```bash
pg_dump -h localhost -p 5433 -U postgres -d resume_db > backup.sql
```

### Restore
```bash
psql -h localhost -p 5433 -U postgres -d resume_db < backup.sql
```

### Connection Test
```bash
node src/server.js
```

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=resume_db
DB_USER=postgres
DB_PASSWORD=localpass
DB_SSL=false
```

## Development Commands

```bash
# Start database
docker-compose up -d postgres

# Initialize database
npm run init-db

# Start backend server
npm start

# Development mode
npm run dev
```

## Summary

This database supports a comprehensive career development platform with:

- **27 Tables** covering all aspects of the application
- **AI-Powered Processing** for resume analysis and job matching
- **Scalable Architecture** with proper indexing and relationships
- **User-Centric Design** with Auth0 integration
- **Analytics & Monitoring** for system health and usage
- **Geographic Support** for job locations worldwide
- **Learning Integration** for career development

The schema is designed to handle high-volume job processing, AI-powered resume analysis, and personalized career recommendations while maintaining data integrity and performance.

---

*This documentation reflects the actual existing database schema as of the current version.*
