CREATE POLICY "Conversation participants read counterpart profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.buyer_id = profiles.user_id AND c.producer_id = auth.uid())
         OR (c.producer_id = profiles.user_id AND c.buyer_id = auth.uid())
    )
  );