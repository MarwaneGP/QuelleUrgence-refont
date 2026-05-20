-- Audit logs — traçabilité des actions sur le site (connexion, formulaires, CRUD…)
-- Table append-only consultée depuis le panel admin (/admin/log).

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Acteur (nullable : actions anonymes possibles — ex. recherche dossier publique)
  user_id uuid references auth.users(id) on delete set null,
  user_email text,

  -- Catégorisation de l'évènement
  -- ex. 'auth.login', 'auth.logout', 'operator.create', 'operator.update',
  --     'operator.delete', 'triage.create', 'dossier.view', 'dossier.search'
  action text not null check (length(trim(action)) > 0),

  -- Ressource concernée (ex. 'operator', 'dossier', 'triage')
  resource text,
  resource_id text,

  -- Contexte HTTP
  method text,
  status_code int,
  path text,
  ip text,
  user_agent text,

  -- Payload libre (avant/après, raison d'échec, etc.). Aucune donnée sensible attendue.
  details jsonb not null default '{}'::jsonb
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);
create index if not exists audit_logs_user_id_idx
  on public.audit_logs (user_id);
create index if not exists audit_logs_action_idx
  on public.audit_logs (action);
create index if not exists audit_logs_resource_idx
  on public.audit_logs (resource, resource_id);

-- RLS : seul le service_role (côté serveur) peut accéder.
-- Aucune policy = deny pour anon/authenticated ; service_role bypass RLS.
alter table public.audit_logs enable row level security;
