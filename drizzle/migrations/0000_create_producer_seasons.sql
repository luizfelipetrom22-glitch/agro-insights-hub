CREATE TABLE public.producer_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  season_name text,
  crop text,
  area_hectares numeric CHECK (area_hectares IS NULL OR area_hectares > 0),
  expected_yield_bags_ha numeric CHECK (expected_yield_bags_ha IS NULL OR expected_yield_bags_ha > 0),
  seeds_fertilizers_cost_ha numeric CHECK (seeds_fertilizers_cost_ha IS NULL OR seeds_fertilizers_cost_ha >= 0),
  operation_cost_ha numeric CHECK (operation_cost_ha IS NULL OR operation_cost_ha >= 0),
  harvest_cost_ha numeric CHECK (harvest_cost_ha IS NULL OR harvest_cost_ha >= 0),
  freight_storage_cost_ha numeric CHECK (freight_storage_cost_ha IS NULL OR freight_storage_cost_ha >= 0),
  land_cost_ha numeric CHECK (land_cost_ha IS NULL OR land_cost_ha >= 0),
  target_margin_pct numeric CHECK (target_margin_pct IS NULL OR (target_margin_pct >= 0 AND target_margin_pct < 100)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.producer_seasons TO authenticated;
GRANT ALL ON public.producer_seasons TO service_role;

ALTER TABLE public.producer_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "producer seasons owner all"
  ON public.producer_seasons
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_producer_seasons_updated_at
  BEFORE UPDATE ON public.producer_seasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();