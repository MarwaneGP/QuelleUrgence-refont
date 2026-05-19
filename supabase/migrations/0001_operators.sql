-- Operators (médecins) — profil étendu de auth.users
-- Crée la table, le trigger updated_at, la vue jointe email, et active RLS.

create table if not exists public.operators (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists operators_last_name_idx on public.operators (last_name);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_operators_set_updated_at on public.operators;
create trigger trg_operators_set_updated_at
before update on public.operators
for each row
execute function public.set_updated_at();

-- Vue jointe avec l'email d'auth.users pour simplifier les lectures côté app
create or replace view public.operators_with_email
with (security_invoker = true) as
select
  o.id,
  o.first_name,
  o.last_name,
  u.email,
  o.created_at,
  o.updated_at
from public.operators o
join auth.users u on u.id = o.id;

-- RLS : seul le service_role (côté serveur) peut accéder.
-- Aucune policy = deny pour anon/authenticated ; service_role bypass RLS.
alter table public.operators enable row level security;
