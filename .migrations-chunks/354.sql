CREATE POLICY "AI tasks pending approval visible to admin only"
ON public.tasks
FOR SELECT
USING (
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = FALSE THEN
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    ELSE
      TRUE
  END
);