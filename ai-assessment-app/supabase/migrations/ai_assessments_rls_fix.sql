-- Loosen insert/select RLS policies for public anonymous usage
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_assessments' AND policyname = 'anon_insert_ai_assessments'
  ) THEN
    DROP POLICY "anon_insert_ai_assessments" ON public.ai_assessments;
  END IF;
  CREATE POLICY "anon_insert_ai_assessments" ON public.ai_assessments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_assessments' AND policyname = 'anon_select_ai_assessments'
  ) THEN
    DROP POLICY "anon_select_ai_assessments" ON public.ai_assessments;
  END IF;
  CREATE POLICY "anon_select_ai_assessments" ON public.ai_assessments
    FOR SELECT TO anon, authenticated
    USING (true);
END$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.ai_assessments TO anon, authenticated;

-- Ensure checks are enforced at table level already
ALTER TABLE public.ai_assessments
  ALTER COLUMN cohort SET NOT NULL;
