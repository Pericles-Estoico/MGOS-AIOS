CREATE POLICY "Users can insert own notification preferences"
ON notification_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);