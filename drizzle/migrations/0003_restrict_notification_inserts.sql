DROP POLICY IF EXISTS "Authenticated create notifications" ON public.notifications;
CREATE POLICY "Users create own notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());