-- Brittany Niemi Rescues: database schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run: it only creates things that don't exist yet.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Staff: only users listed here can manage the site.
-- After creating the rescue's login (Authentication → Users → Add user), run:
--   insert into public.staff (user_id) select id from auth.users where email = 'her@email.com';
-- ---------------------------------------------------------------------------
create table if not exists public.staff (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cats (public)
-- ---------------------------------------------------------------------------
create table if not exists public.cats (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sex text not null check (sex in ('female', 'male')),
  birth_date date not null,
  color text not null default '',
  breed text not null default '',
  status text not null default 'available' check (status in ('available', 'pending', 'adopted')),
  special_needs boolean not null default false,
  special_needs_notes text not null default '',
  description text not null default '',
  personality text[] not null default '{}',
  good_with_kids text not null default 'unknown' check (good_with_kids in ('yes', 'no', 'unknown')),
  good_with_cats text not null default 'unknown' check (good_with_cats in ('yes', 'no', 'unknown')),
  good_with_dogs text not null default 'unknown' check (good_with_dogs in ('yes', 'no', 'unknown')),
  spayed_neutered boolean not null default false,
  vaccinated boolean not null default false,
  microchipped boolean not null default false,
  adoption_fee integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cats_updated_at on public.cats;
create trigger cats_updated_at before update on public.cats
  for each row execute function public.set_updated_at();

create table if not exists public.cat_photos (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null references public.cats on delete cascade,
  path text not null,
  alt text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists cat_photos_cat_id_idx on public.cat_photos (cat_id, position);

-- ---------------------------------------------------------------------------
-- Applications (anyone can submit, only staff can read)
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('adopt', 'foster')),
  cat_id uuid references public.cats on delete set null,
  status text not null default 'new' check (status in ('new', 'meet_scheduled', 'approved', 'rejected')),
  name text not null,
  email text not null,
  phone text not null default '',
  city text not null default '',
  answers jsonb not null default '{}',
  admin_notes text not null default '',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_status_idx on public.applications (status, created_at desc);

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Meet & greets (staff only)
-- ---------------------------------------------------------------------------
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  starts_at timestamptz not null,
  duration_minutes integer not null default 60,
  location text not null default '',
  notes text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists meetings_starts_at_idx on public.meetings (starts_at);

-- ---------------------------------------------------------------------------
-- Adoption records (staff only)
-- ---------------------------------------------------------------------------
create table if not exists public.adoptions (
  id uuid primary key default gen_random_uuid(),
  cat_id uuid not null unique references public.cats on delete cascade,
  application_id uuid references public.applications on delete set null,
  adopted_on date not null default current_date,
  adopter_name text not null,
  adopter_email text not null default '',
  adopter_phone text not null default '',
  adopter_address text not null default '',
  fee_paid numeric(10, 2),
  microchip_number text not null default '',
  follow_up_on date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.staff enable row level security;
alter table public.cats enable row level security;
alter table public.cat_photos enable row level security;
alter table public.applications enable row level security;
alter table public.meetings enable row level security;
alter table public.adoptions enable row level security;

drop policy if exists "staff read own row" on public.staff;
create policy "staff read own row" on public.staff
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "cats are public" on public.cats;
create policy "cats are public" on public.cats
  for select to anon, authenticated using (true);
drop policy if exists "staff manage cats" on public.cats;
create policy "staff manage cats" on public.cats
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "cat photos are public" on public.cat_photos;
create policy "cat photos are public" on public.cat_photos
  for select to anon, authenticated using (true);
drop policy if exists "staff manage cat photos" on public.cat_photos;
create policy "staff manage cat photos" on public.cat_photos
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "anyone can apply" on public.applications;
create policy "anyone can apply" on public.applications
  for insert to anon, authenticated
  with check (status = 'new' and admin_notes = '' and decided_at is null);
drop policy if exists "staff manage applications" on public.applications;
create policy "staff manage applications" on public.applications
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff manage meetings" on public.meetings;
create policy "staff manage meetings" on public.meetings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff manage adoptions" on public.adoptions;
create policy "staff manage adoptions" on public.adoptions
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Photo storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cat-photos', 'cat-photos', true)
on conflict (id) do nothing;

drop policy if exists "staff upload cat photos" on storage.objects;
create policy "staff upload cat photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'cat-photos' and public.is_staff());
drop policy if exists "staff update cat photos" on storage.objects;
create policy "staff update cat photos" on storage.objects
  for update to authenticated using (bucket_id = 'cat-photos' and public.is_staff());
drop policy if exists "staff delete cat photos" on storage.objects;
create policy "staff delete cat photos" on storage.objects
  for delete to authenticated using (bucket_id = 'cat-photos' and public.is_staff());
