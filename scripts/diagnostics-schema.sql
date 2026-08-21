-- Run this once in the Supabase SQL Editor before deploying diagnostics.
create table if not exists public.app_diagnostics (
  id uuid primary key,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  level text not null check (level in ('info', 'warn', 'error')),
  event_type text not null,
  user_id uuid,
  user_email text,
  installation_id uuid not null,
  tab_id uuid not null,
  route text,
  client_version text,
  build_time timestamptz,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists app_diagnostics_occurred_at_idx
  on public.app_diagnostics (occurred_at desc);
create index if not exists app_diagnostics_event_type_idx
  on public.app_diagnostics (event_type, occurred_at desc);
create index if not exists app_diagnostics_user_id_idx
  on public.app_diagnostics (user_id, occurred_at desc);

alter table public.app_diagnostics enable row level security;

grant select, insert on public.app_diagnostics to authenticated;

drop policy if exists "Authenticated users can add diagnostics" on public.app_diagnostics;
create policy "Authenticated users can add diagnostics"
  on public.app_diagnostics for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can read diagnostics" on public.app_diagnostics;
create policy "Authenticated users can read diagnostics"
  on public.app_diagnostics for select
  to authenticated
  using (true);

comment on table public.app_diagnostics is
  'Privacy-limited operational logs from the PBX scheduling app. Contains task IDs and counts, never task content or auth tokens.';

-- Optional maintenance command: retain 90 days of diagnostics.
-- delete from public.app_diagnostics where occurred_at < now() - interval '90 days';
