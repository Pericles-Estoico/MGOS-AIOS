CREATE POLICY "Users can see own notification preferences"
ON notification_preferences
FOR SELECT
USING (auth.uid() = user_id);