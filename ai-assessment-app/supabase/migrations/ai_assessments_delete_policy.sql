ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_assessments' AND policyname = 'anon_delete_ai_assessments'
  ) THEN
    DROP POLICY "anon_delete_ai_assessments" ON public.ai_assessments;
  END IF;
  CREATE POLICY "anon_delete_ai_assessments" ON public.ai_assessments
    FOR DELETE TO anon, authenticated
    USING (true);
END$$;

GRANT DELETE ON public.ai_assessments TO anon, authenticated;
