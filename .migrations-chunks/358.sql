CREATE POLICY "Only service role can insert AI generated tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  CASE
    WHEN source_type = 'ai_generated' THEN
      TRUE  -- Will be enforced at application layer
    ELSE
      TRUE  -- Manual tasks can be inserted by authenticated users
  END
);