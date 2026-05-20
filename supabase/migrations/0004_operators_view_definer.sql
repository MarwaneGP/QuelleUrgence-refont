    -- Fix « permission denied for table users » lors de la lecture de
    -- `operators_with_email` via le service_role.
    --
    -- La vue jointait `auth.users` avec `with (security_invoker = true)` (réglage hérité
    -- de 0001_operators.sql). Avec ce mode, le JOIN s'exécute avec les droits de
    -- l'appelant ; or selon la configuration du projet Supabase, `service_role` n'a
    -- pas SELECT explicite sur `auth.users` même s'il bypasse la RLS.
    --
    -- Solution : basculer la vue en `security_invoker = false` (mode definer). Elle
    -- s'exécute alors avec les droits du propriétaire (postgres) qui a un accès
    -- complet à auth.users. La table `public.operators` reste en RLS deny-by-default
    -- côté client (la vue n'expose rien au navigateur — accès serveur uniquement).

    alter view public.operators_with_email set (security_invoker = false);
