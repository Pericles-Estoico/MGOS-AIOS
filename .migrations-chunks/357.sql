CREATE POLICY "Only admin can approve AI generated tasks"
ON public.tasks
FOR UPDATE
USING (
  source_type = 'ai_generated' AND admin_approved = FALSE AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  admin_approved = TRUE AND
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);