alter table public.simulations
  add column if not exists name text,
  add column if not exists target_margin_pct numeric,
  add column if not exists seeds_fertilizers_cost_ha numeric,
  add column if not exists operation_cost_ha numeric,
  add column if not exists harvest_cost_ha numeric,
  add column if not exists freight_storage_cost_ha numeric,
  add column if not exists land_cost_ha numeric;