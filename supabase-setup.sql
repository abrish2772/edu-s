-- Run this in Supabase SQL Editor.
create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  job text,
  status text not null default 'Waiting for Documents',
  notes text,
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid()
);

alter table public.workers enable row level security;

create policy "Users can view only their workers"
on public.workers for select to authenticated
using (auth.uid() = user_id);

create policy "Users can add their own workers"
on public.workers for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update only their workers"
on public.workers for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete only their workers"
on public.workers for delete to authenticated
using (auth.uid() = user_id);
