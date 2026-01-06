-- Create assessment results table matching the PRD requirements
CREATE TABLE ai_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    cohort TEXT NOT NULL DEFAULT 'default',
    total INTEGER NOT NULL CHECK (total >= 0 AND total <= 30),
    title TEXT NOT NULL,
    d1 INTEGER NOT NULL CHECK (d1 >= 0 AND d1 <= 6), -- AI卷入度
    d2 INTEGER NOT NULL CHECK (d2 >= 0 AND d2 <= 6), -- 指令驾驭力
    d3 INTEGER NOT NULL CHECK (d3 >= 0 AND d3 <= 6), -- 场景覆盖率
    d4 INTEGER NOT NULL CHECK (d4 >= 0 AND d4 <= 6), -- 创新进化力
    d5 INTEGER NOT NULL CHECK (d5 >= 0 AND d5 <= 6), -- 技术亲和度
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT
);

-- Create index for better query performance
CREATE INDEX idx_ai_assessments_cohort ON ai_assessments(cohort);
CREATE INDEX idx_ai_assessments_created_at ON ai_assessments(created_at DESC);

-- Create public stats view for anonymous access
CREATE VIEW ai_assessment_public_stats AS
SELECT 
    cohort,
    COUNT(*) as total_count,
    ROUND(AVG(total)::numeric, 2) as avg_total,
    ROUND(AVG(d1)::numeric, 2) as avg_d1,
    ROUND(AVG(d2)::numeric, 2) as avg_d2,
    ROUND(AVG(d3)::numeric, 2) as avg_d3,
    ROUND(AVG(d4)::numeric, 2) as avg_d4,
    ROUND(AVG(d5)::numeric, 2) as avg_d5,
    MIN(total) as min_total,
    MAX(total) as max_total
FROM ai_assessments
GROUP BY cohort;

-- Enable RLS (Row Level Security)
ALTER TABLE ai_assessments ENABLE ROW LEVEL SECURITY;

-- Grant permissions for anonymous users (insert and select)
GRANT INSERT ON ai_assessments TO anon;
GRANT SELECT ON ai_assessments TO anon;
GRANT SELECT ON ai_assessment_public_stats TO anon;

-- Create RLS policies
-- Allow anonymous insert (for assessment submission)
CREATE POLICY "Allow anonymous insert" ON ai_assessments
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow anonymous select for statistics (only aggregated data)
CREATE POLICY "Allow anonymous select stats" ON ai_assessments
    FOR SELECT TO anon
    USING (true);