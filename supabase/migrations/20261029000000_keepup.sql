-- Keepup: Tabellen für Synchronisierung und Push-Erinnerungen
-- Im Supabase-Dashboard unter "SQL Editor" einfügen und ausführen.

-- Alle App-Daten (Habits, Einträge, Todos, Stimmungen, Fokus, Einstellungen)
create table if not exists public.records (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  collection text not null,
  id text not null,
  data jsonb not null,
  deleted boolean not null default false,
  client_updated_at timestamptz not null,
  server_updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, collection, id)
);

create index if not exists records_user_updated on public.records (user_id, server_updated_at);

alter table public.records enable row level security;

drop policy if exists "eigene Daten" on public.records;
create policy "eigene Daten" on public.records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Neuere Änderung gewinnt; Server-Zeitstempel für den Abgleich setzen
create or replace function public.records_lww() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.client_updated_at < old.client_updated_at then
    return old;
  end if;
  new.server_updated_at := clock_timestamp();
  return new;
end $$;

drop trigger if exists records_lww on public.records;
create trigger records_lww before insert or update on public.records
  for each row execute function public.records_lww();

-- Push-Abos (ein Eintrag pro Gerät)
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh text not null,
  auth text not null,
  timezone text not null default 'Europe/Berlin',
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "eigene Abos" on public.push_subscriptions;
create policy "eigene Abos" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Merkt sich gesendete Erinnerungen, damit nichts doppelt kommt
create table if not exists public.sent_reminders (
  key text primary key,
  sent_at timestamptz not null default now()
);
alter table public.sent_reminders enable row level security;
