CREATE OR REPLACE FUNCTION public.is_published_listing_photo(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings l WHERE l.status = 'ativo' AND _name = ANY(l.photos));
$$;

CREATE OR REPLACE FUNCTION public.is_profile_avatar(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url = _name)
      OR EXISTS (SELECT 1 FROM public.buyer_profiles b WHERE b.avatar_url = _name);
$$;

DROP POLICY IF EXISTS "Public read listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;

CREATE POLICY "Read own or published listing photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-photos' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_published_listing_photo(name)
  ));

CREATE POLICY "Read own or profile avatars" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_profile_avatar(name)
  ));