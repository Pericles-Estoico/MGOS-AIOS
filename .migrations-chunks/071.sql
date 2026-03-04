CREATE POLICY "Insert review - QA only"
  ON public.qa_reviews FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'qa');