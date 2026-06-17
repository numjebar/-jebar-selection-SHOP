-- JE BAR production data snapshot
-- Run this in Supabase SQL Editor before deploying the app.

create table if not exists catalog_state (
  id text primary key default 'main',
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table catalog_state enable row level security;

drop policy if exists "catalog state public read" on catalog_state;
create policy "catalog state public read"
on catalog_state for select
using (true);

-- Writes are handled by the Next.js API route with SUPABASE_SERVICE_ROLE_KEY.
-- Do not add a public insert/update policy for production.
