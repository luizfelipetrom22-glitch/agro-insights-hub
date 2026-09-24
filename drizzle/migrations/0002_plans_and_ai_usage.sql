CREATE TABLE public.user_plans (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_plans TO authenticated;
GRANT ALL ON public.user_plans TO service_role;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own plan" ON public.user_plans FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage plans" ON public.user_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.plan_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.plan_interest TO authenticated;
GRANT ALL ON public.plan_interest TO service_role;
ALTER TABLE public.plan_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users register own interest" ON public.plan_interest FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own interest" ON public.plan_interest FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('analyst','report')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_user_kind_idx ON public.ai_usage(user_id, kind, created_at);
GRANT SELECT, INSERT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users log own usage" ON public.ai_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.current_plan()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT plan FROM public.user_plans WHERE user_id = auth.uid()), 'free')
$$;
REVOKE EXECUTE ON FUNCTION public.current_plan() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.current_plan() TO authenticated;

-- Limite de cenários no plano grátis (1), aplicado no banco.
CREATE OR REPLACE FUNCTION public.enforce_scenario_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE((SELECT plan FROM public.user_plans WHERE user_id = NEW.user_id), 'free') = 'free'
     AND (SELECT count(*) FROM public.simulations WHERE user_id = NEW.user_id) >= 1 THEN
    RAISE EXCEPTION 'PLANO_GRATIS_LIMITE_CENARIOS';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER simulations_plan_limit BEFORE INSERT ON public.simulations
FOR EACH ROW EXECUTE FUNCTION public.enforce_scenario_limit();

GRANT DELETE ON public.reports TO authenticated;