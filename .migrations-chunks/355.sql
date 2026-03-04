CREATE POLICY "AI tasks after approval follow standard visibility"
ON public.tasks
FOR SELECT
USING (
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = TRUE THEN
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
      OR (assigned_to = auth.uid())
      OR (created_by = auth.uid())
    WHEN source_type = 'manual' THEN
      TRUE
    ELSE
      FALSE
  END
);