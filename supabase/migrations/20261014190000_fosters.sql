-- Foster roster: people who foster for the rescue, and every cat they've fostered.

create table if not exists public.fosters (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications on delete set null,
  name text not null,
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  can_foster text[] not null default '{}',
  notes text not null default '',
  on_break boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists fosters_email_idx on public.fosters (lower(email));

drop trigger if exists fosters_updated_at on public.fosters;
create trigger fosters_updated_at before update on public.fosters
  for each row execute function public.set_updated_at();

create table if not exists public.foster_placements (
  id uuid primary key default gen_random_uuid(),
  foster_id uuid not null references public.fosters on delete cascade,
  -- Kept when the cat record is deleted, and used for cats from before the website.
  cat_id uuid references public.cats on delete set null,
  cat_name text not null,
  started_on date not null default current_date,
  ended_on date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists foster_placements_foster_idx on public.foster_placements (foster_id, started_on desc);

alter table public.fosters enable row level security;
alter table public.foster_placements enable row level security;

drop policy if exists "staff manage fosters" on public.fosters;
create policy "staff manage fosters" on public.fosters
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "staff manage foster placements" on public.foster_placements;
create policy "staff manage foster placements" on public.foster_placements
  for all to authenticated using (public.is_staff()) with check (public.is_staff());
