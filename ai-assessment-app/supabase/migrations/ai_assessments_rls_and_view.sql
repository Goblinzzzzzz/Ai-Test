-- Enable RLS (idempotent)
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts with bounds validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_assessments' AND policyname = 'anon_insert_ai_assessments'
  ) THEN
    CREATE POLICY "anon_insert_ai_assessments" ON public.ai_assessments
      FOR INSERT TO anon
      WITH CHECK (
        cohort IS NOT NULL AND
        total >= 0 AND total <= 30 AND
        d1 >= 0 AND d1 <= 6 AND
        d2 >= 0 AND d2 <= 6 AND
        d3 >= 0 AND d3 <= 6 AND
        d4 >= 0 AND d4 <= 6 AND
        d5 >= 0 AND d5 <= 6
      );
  END IF;
END$$;

-- Allow anonymous read from ai_assessments (for recent lists and distributions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_assessments' AND policyname = 'anon_select_ai_assessments'
  ) THEN
    CREATE POLICY "anon_select_ai_assessments" ON public.ai_assessments
      FOR SELECT TO anon
      USING (true);
  END IF;
END$$;

-- Aggregated public stats view per cohort
CREATE OR REPLACE VIEW public.ai_assessment_public_stats AS
SELECT
  cohort,
  COUNT(*) AS total_count,
  AVG(total) AS avg_total,
  AVG(d1) AS avg_d1,
  AVG(d2) AS avg_d2,
  AVG(d3) AS avg_d3,
  AVG(d4) AS avg_d4,
  AVG(d5) AS avg_d5,
  MIN(total) AS min_total,
  MAX(total) AS max_total
FROM public.ai_assessments
GROUP BY cohort;

GRANT SELECT ON public.ai_assessment_public_stats TO anon;
