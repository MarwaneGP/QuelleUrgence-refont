-- Ajout d'un rôle sur les opérateurs pour distinguer admin / opérateur standard.
-- Tous les comptes existants restent en 'operator' ; un admin doit être promu manuellement
-- via :
--   update public.operators set role = 'admin' where id = '<uuid>';

alter table public.operators
  add column if not exists role text not null default 'operator'
    check (role in ('operator', 'admin'));

create index if not exists operators_role_idx on public.operators (role);

create or replace view public.operators_with_email
with (security_invoker = true) as
select
  o.id,
  o.first_name,
  o.last_name,
  u.email,
  o.created_at,
  o.updated_at,
  o.role
from public.operators o
join auth.users u on u.id = o.id;
