CREATE POLICY "Public read listing photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-photos');
CREATE POLICY "Owners write listing photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update listing photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete listing photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');
CREATE POLICY "Owners write avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Participants read chat attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );
CREATE POLICY "Participants write chat attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_conversation_participant(((storage.foldername(name))[1])::uuid, auth.uid())
  );