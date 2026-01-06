-- Reset all public tables by truncating data and restarting identities
-- Safe for FK chains due to CASCADE

BEGIN;

TRUNCATE TABLE
  public.ai_assessments,
  public.assessments,
  public.assessment_dimensions,
  public.ability_scores,
  public.improvement_areas,
  public.learning_paths,
  public.learning_resources,
  public.users
RESTART IDENTITY CASCADE;

COMMIT;

