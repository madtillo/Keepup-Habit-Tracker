-- Ruft den Erinnerungsdienst jede Minute auf.
-- VOR dem Ausführen ersetzen:
--   DEIN-PROJEKT  → deine Projekt-ID (aus der Supabase-URL)
--   DEIN-GEHEIMNIS → derselbe Wert wie das Secret CRON_SECRET der Edge Function

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('keepup-reminders') where exists (select 1 from cron.job where jobname = 'keepup-reminders');

select cron.schedule(
  'keepup-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://DEIN-PROJEKT.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'DEIN-GEHEIMNIS'),
    body := '{}'::jsonb
  );
  $$
);

-- Alte Einträge der Doppel-Sperre aufräumen (täglich)
select cron.unschedule('keepup-cleanup') where exists (select 1 from cron.job where jobname = 'keepup-cleanup');
select cron.schedule('keepup-cleanup', '17 3 * * *', $$ delete from public.sent_reminders where sent_at < now() - interval '2 days' $$);
