CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);