-- Roles enum
create type public.app_role as enum ('user', 'admin');

-- user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "users read own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid());

-- has_role security definer function
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- profiles table
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text,
  farm_name text,
  city text,
  state char(2),
  crops text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "profiles owner all"
  on public.profiles for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- simulations table
create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  crop text not null,
  area_hectares numeric not null default 0,
  input_cost numeric not null default 0,
  price_per_bag numeric not null default 0,
  exchange_rate numeric not null default 0,
  yield_bags_per_ha numeric not null default 0,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.simulations to authenticated;
grant all on public.simulations to service_role;
alter table public.simulations enable row level security;

create policy "simulations owner all"
  on public.simulations for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- alerts table
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  commodity text not null,
  condition text not null,
  threshold numeric not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.alerts to authenticated;
grant all on public.alerts to service_role;
alter table public.alerts enable row level security;

create policy "alerts owner all"
  on public.alerts for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- reports table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  harvest text,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;

create policy "reports owner all"
  on public.reports for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_simulations_updated_at
  before update on public.simulations
  for each row execute function public.update_updated_at_column();

create trigger update_alerts_updated_at
  before update on public.alerts
  for each row execute function public.update_updated_at_column();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();