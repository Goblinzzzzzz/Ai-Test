-- Railway PostgreSQL Migration Script
-- This script is idempotent and can be run multiple times safely
-- It creates the database schema for the AI Assessment application

-- Create ai_assessments table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT '匿名用户',
    cohort TEXT NOT NULL DEFAULT 'default',
    total INTEGER NOT NULL CHECK (total >= 0 AND total <= 30),
    title TEXT NOT NULL,
    d1 INTEGER NOT NULL CHECK (d1 >= 0 AND d1 <= 6), -- AI卷入度
    d2 INTEGER NOT NULL CHECK (d2 >= 0 AND d2 <= 6), -- 指令驾驭力
    d3 INTEGER NOT NULL CHECK (d3 >= 0 AND d3 <= 6), -- 场景覆盖率
    d4 INTEGER NOT NULL CHECK (d4 >= 0 AND d4 <= 6), -- 创新进化力
    d5 INTEGER NOT NULL CHECK (d5 >= 0 AND d5 <= 6), -- 技术亲和度
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT
);

-- Create indexes for better query performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_ai_assessments_cohort 
    ON ai_assessments(cohort);

CREATE INDEX IF NOT EXISTS idx_ai_assessments_created_at 
    ON ai_assessments(created_at DESC);

-- Create or replace the public stats view for aggregated statistics
CREATE OR REPLACE VIEW ai_assessment_public_stats AS
SELECT 
    cohort,
    COUNT(*) as total_count,
    AVG(total) as avg_total,
    AVG(d1) as avg_d1,
    AVG(d2) as avg_d2,
    AVG(d3) as avg_d3,
    AVG(d4) as avg_d4,
    AVG(d5) as avg_d5,
    MIN(total) as min_total,
    MAX(total) as max_total
FROM ai_assessments
GROUP BY cohort;

-- Add comments for documentation
COMMENT ON TABLE ai_assessments IS 'Stores AI assessment results with scores across 5 dimensions';
COMMENT ON COLUMN ai_assessments.name IS 'User name, defaults to 匿名用户 (Anonymous User)';
COMMENT ON COLUMN ai_assessments.cohort IS 'Group identifier for segmenting assessment data';
COMMENT ON COLUMN ai_assessments.total IS 'Total score (0-30)';
COMMENT ON COLUMN ai_assessments.title IS 'Assessment result title/category';
COMMENT ON COLUMN ai_assessments.d1 IS 'Dimension 1: AI卷入度 (AI Engagement Level) (0-6)';
COMMENT ON COLUMN ai_assessments.d2 IS 'Dimension 2: 指令驾驭力 (Command Mastery) (0-6)';
COMMENT ON COLUMN ai_assessments.d3 IS 'Dimension 3: 场景覆盖率 (Scenario Coverage) (0-6)';
COMMENT ON COLUMN ai_assessments.d4 IS 'Dimension 4: 创新进化力 (Innovation Evolution) (0-6)';
COMMENT ON COLUMN ai_assessments.d5 IS 'Dimension 5: 技术亲和度 (Technical Affinity) (0-6)';
COMMENT ON COLUMN ai_assessments.answers IS 'JSON object containing detailed assessment answers';
COMMENT ON COLUMN ai_assessments.user_agent IS 'Browser user agent string for analytics';
COMMENT ON VIEW ai_assessment_public_stats IS 'Aggregated statistics per cohort for public access';
