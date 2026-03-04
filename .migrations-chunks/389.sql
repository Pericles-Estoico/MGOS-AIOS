ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'head', 'executor', 'qa', 'ceo', 'lider'));