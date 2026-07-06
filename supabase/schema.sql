-- =============================================================================
-- Grenfell Tower Digital Memorial — Supabase schema (SPEC §3)
-- Run in the Supabase SQL editor or via `supabase db push`.
-- The database, not the client, enforces the moderation model.
-- =============================================================================

-- ---------- profiles --------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 2 and 24),
  is_moderator boolean not null default false,
  created_at   timestamptz not null default now()
);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- tributes ---------------------------------------------------------
create table if not exists public.tributes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 24),
  message      text not null check (char_length(trim(message)) between 1 and 60),
  status       text not null default 'pending'
               check (status in ('pending','approved','rejected')),
  flagged      boolean not null default false,   -- prefilter hit: human attention
  created_at   timestamptz not null default now(),
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz
);

create index if not exists tributes_status_created_idx
  on public.tributes (status, created_at);
create index if not exists tributes_user_created_idx
  on public.tributes (user_id, created_at desc);

-- force pending on insert regardless of client payload, snapshot display name,
-- and enforce the 10-minute rate limit (SPEC §3, §4).
create or replace function public.tributes_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  last_at timestamptz;
begin
  new.status      := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.user_id     := auth.uid();

  select p.display_name into new.display_name
    from public.profiles p where p.id = auth.uid();
  if new.display_name is null then
    raise exception 'PROFILE_INCOMPLETE' using hint = 'Set a display name first.';
  end if;

  select max(created_at) into last_at
    from public.tributes where user_id = auth.uid();
  if last_at is not null and last_at > now() - interval '10 minutes' then
    raise exception 'RATE_LIMITED' using hint = 'One tribute every 10 minutes.';
  end if;

  return new;
end $$;

drop trigger if exists tributes_before_insert on public.tributes;
create trigger tributes_before_insert
  before insert on public.tributes
  for each row execute function public.tributes_before_insert();

-- ---------- moderation_log ---------------------------------------------------
create table if not exists public.moderation_log (
  id           uuid primary key default gen_random_uuid(),
  tribute_id   uuid not null references public.tributes (id) on delete cascade,
  moderator_id uuid not null references public.profiles (id),
  action       text not null check (action in ('approve','reject')),
  note         text,
  created_at   timestamptz not null default now()
);

-- ---------- helper -----------------------------------------------------------
create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select is_moderator from public.profiles where id = auth.uid()), false);
$$;

-- ---------- RLS --------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.tributes       enable row level security;
alter table public.moderation_log enable row level security;

-- profiles
create policy "own profile read"    on public.profiles for select
  using (id = auth.uid() or public.is_moderator());
create policy "own profile update"  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and is_moderator = (select is_moderator
              from public.profiles p where p.id = auth.uid())); -- cannot self-promote

-- tributes
create policy "insert own tribute"  on public.tributes for insert to authenticated
  with check (user_id = auth.uid());
create policy "read approved"       on public.tributes for select
  using (status = 'approved' or user_id = auth.uid() or public.is_moderator());
create policy "moderators review"   on public.tributes for update
  using (public.is_moderator())
  with check (public.is_moderator()
              and status in ('approved','rejected')
              and reviewed_by = auth.uid());
-- no delete policy: tributes are never deleted, only rejected (audit integrity)

-- moderation_log
create policy "moderators log"      on public.moderation_log for insert to authenticated
  with check (public.is_moderator() and moderator_id = auth.uid());
create policy "moderators read log" on public.moderation_log for select
  using (public.is_moderator());

-- ---------- realtime ---------------------------------------------------------
-- Enable Realtime on public.tributes in the dashboard (Database → Replication),
-- or: alter publication supabase_realtime add table public.tributes;
-- Clients subscribe to UPDATE events filtered status=eq.approved; RLS ensures
-- anon subscribers never receive pending/rejected rows.

-- ---------- seed (dev only) --------------------------------------------------
-- To promote yourself to moderator after first sign-in:
--   update public.profiles set is_moderator = true where id = '<your-user-uuid>';
