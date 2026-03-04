CREATE POLICY "Admins see all reviews"
  ON public.qa_reviews FOR SELECT
  USING (auth.jwt()->>'role' = 'admin');