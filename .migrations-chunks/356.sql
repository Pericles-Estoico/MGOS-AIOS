CREATE POLICY "AI tasks pending approval can only be updated by admin"
ON public.tasks
FOR UPDATE
USING (
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = FALSE THEN
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    ELSE
      TRUE
  END
)
WITH CHECK (
  CASE
    WHEN source_type = 'ai_generated' AND admin_approved = FALSE THEN
      (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    ELSE
      TRUE
  END
);