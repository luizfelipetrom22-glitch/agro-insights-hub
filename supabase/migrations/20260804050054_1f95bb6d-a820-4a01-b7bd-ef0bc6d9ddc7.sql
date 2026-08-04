-- 1. user type enum + column on profiles
CREATE TYPE public.user_type AS ENUM ('produtor', 'comprador');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_type public.user_type NOT NULL DEFAULT 'produtor';

GRANT SELECT ON public.profiles TO anon;

CREATE OR REPLACE FUNCTION public.current_user_type()
RETURNS public.user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_type() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.current_user_type() TO authenticated, service_role;

-- Public read of producer profiles (already-existing table gets a public policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
      AND policyname = 'Producer profiles are public'
  ) THEN
    CREATE POLICY "Producer profiles are public" ON public.profiles
      FOR SELECT TO anon, authenticated
      USING (user_type = 'produtor');
  END IF;
END $$;

-- 2. buyer_profiles
CREATE TABLE public.buyer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  company TEXT,
  tax_id TEXT,
  city TEXT,
  state TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  avg_quantity NUMERIC,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_profiles TO authenticated;
GRANT ALL ON public.buyer_profiles TO service_role;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers manage their own profile" ON public.buyer_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. listings
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'saco',
  price NUMERIC,
  state TEXT,
  city TEXT,
  harvest TEXT,
  certifications TEXT[] NOT NULL DEFAULT '{}',
  organic BOOLEAN NOT NULL DEFAULT false,
  family_farming BOOLEAN NOT NULL DEFAULT false,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX listings_product_idx ON public.listings (lower(product));
CREATE INDEX listings_state_idx ON public.listings (state);
CREATE INDEX listings_user_idx ON public.listings (user_id);

GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are public" ON public.listings
  FOR SELECT TO anon, authenticated
  USING (status = 'ativo');

CREATE POLICY "Owners read their own listings" ON public.listings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert their own listings" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update their own listings" ON public.listings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete their own listings" ON public.listings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. purchase_requests
CREATE TABLE public.purchase_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'saco',
  state TEXT,
  city TEXT,
  target_price NUMERIC,
  deadline DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX purchase_requests_product_idx ON public.purchase_requests (lower(product));
CREATE INDEX purchase_requests_user_idx ON public.purchase_requests (user_id);

GRANT SELECT ON public.purchase_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_requests TO authenticated;
GRANT ALL ON public.purchase_requests TO service_role;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open purchase requests are public" ON public.purchase_requests
  FOR SELECT TO anon, authenticated
  USING (status = 'aberto');

CREATE POLICY "Owners read their own requests" ON public.purchase_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert their own requests" ON public.purchase_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update their own requests" ON public.purchase_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners delete their own requests" ON public.purchase_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings ON DELETE CASCADE,
  producer_id UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT favorites_target_check CHECK (
    (listing_id IS NOT NULL AND producer_id IS NULL)
    OR (listing_id IS NULL AND producer_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX favorites_listing_unique ON public.favorites (user_id, listing_id) WHERE listing_id IS NOT NULL;
CREATE UNIQUE INDEX favorites_producer_unique ON public.favorites (user_id, producer_id) WHERE producer_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own favorites" ON public.favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. contact_events
CREATE TABLE public.contact_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX contact_events_buyer_idx ON public.contact_events (buyer_id);
CREATE INDEX contact_events_producer_idx ON public.contact_events (producer_id);

GRANT SELECT, INSERT ON public.contact_events TO authenticated;
GRANT ALL ON public.contact_events TO service_role;
ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read contact events" ON public.contact_events
  FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = producer_id);

CREATE POLICY "Buyers create contact events" ON public.contact_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Buyer profile visible to producers already contacted
CREATE POLICY "Contacted producers read buyer profile" ON public.buyer_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.contact_events ce
    WHERE ce.buyer_id = buyer_profiles.user_id
      AND ce.producer_id = auth.uid()
  ));

-- 7. updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON public.buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. signup handler: honour the chosen user type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen public.user_type := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'user_type', '')::public.user_type,
    'produtor'
  );
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', chosen)
  ON CONFLICT DO NOTHING;

  IF chosen = 'comprador' THEN
    INSERT INTO public.buyer_profiles (user_id, full_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;