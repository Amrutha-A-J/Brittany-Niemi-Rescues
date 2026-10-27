-- Brittany Niemi Rescues: database schema (Cloudflare D1 / SQLite)
--
-- Conventions:
--   ids are UUID strings made by the app (crypto.randomUUID()).
--   timestamps are ISO 8601 UTC strings ("2026-10-27T18:00:00.000Z"); dates are "YYYY-MM-DD".
--   booleans are 0/1; lists and answers are JSON text.

-- ---------------------------------------------------------------------------
-- Staff logins (add one with `npm run staff:add`)
-- ---------------------------------------------------------------------------
create table staff (
  id text primary key,
  email text not null unique collate nocase,
  password_hash text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- The browser keeps a random token in a cookie; only its SHA-256 hash is stored.
create table sessions (
  token_hash text primary key,
  staff_id text not null references staff on delete cascade,
  expires_at text not null
);
create index sessions_staff_idx on sessions (staff_id);

create table password_resets (
  token_hash text primary key,
  staff_id text not null references staff on delete cascade,
  expires_at text not null
);

-- ---------------------------------------------------------------------------
-- Cats (public)
-- ---------------------------------------------------------------------------
create table cats (
  id text primary key,
  slug text not null unique,
  name text not null,
  sex text not null check (sex in ('female', 'male')),
  birth_date text not null,
  color text not null default '',
  breed text not null default '',
  status text not null default 'available' check (status in ('available', 'pending', 'adopted')),
  special_needs integer not null default 0,
  special_needs_notes text not null default '',
  description text not null default '',
  personality text not null default '[]',
  good_with_kids text not null default 'unknown' check (good_with_kids in ('yes', 'no', 'unknown')),
  good_with_cats text not null default 'unknown' check (good_with_cats in ('yes', 'no', 'unknown')),
  good_with_dogs text not null default 'unknown' check (good_with_dogs in ('yes', 'no', 'unknown')),
  spayed_neutered integer not null default 0,
  vaccinated integer not null default 0,
  microchipped integer not null default 0,
  adoption_fee integer,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index cats_status_idx on cats (status, created_at desc);

create trigger cats_updated_at after update on cats
begin
  update cats set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') where id = new.id;
end;

-- `path` is the object key in the R2 photo bucket (or a full URL for sample photos).
create table cat_photos (
  id text primary key,
  cat_id text not null references cats on delete cascade,
  path text not null,
  alt text not null default '',
  position integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index cat_photos_cat_id_idx on cat_photos (cat_id, position);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table applications (
  id text primary key,
  type text not null check (type in ('adopt', 'foster')),
  cat_id text references cats on delete set null,
  status text not null default 'new' check (status in ('new', 'meet_scheduled', 'approved', 'rejected')),
  name text not null,
  email text not null,
  phone text not null default '',
  city text not null default '',
  answers text not null default '{}',
  admin_notes text not null default '',
  decided_at text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index applications_status_idx on applications (status, created_at desc);
create index applications_type_idx on applications (type, created_at desc);

create trigger applications_updated_at after update on applications
begin
  update applications set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') where id = new.id;
end;

-- ---------------------------------------------------------------------------
-- Meet & greets
-- ---------------------------------------------------------------------------
create table meetings (
  id text primary key,
  application_id text not null references applications on delete cascade,
  starts_at text not null,
  duration_minutes integer not null default 60,
  location text not null default '',
  notes text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index meetings_starts_at_idx on meetings (starts_at);
create index meetings_application_idx on meetings (application_id);

-- ---------------------------------------------------------------------------
-- Adoption records
-- ---------------------------------------------------------------------------
create table adoptions (
  id text primary key,
  cat_id text not null unique references cats on delete cascade,
  application_id text references applications on delete set null,
  adopted_on text not null default (date('now')),
  adopter_name text not null,
  adopter_email text not null default '',
  adopter_phone text not null default '',
  adopter_address text not null default '',
  fee_paid real,
  microchip_number text not null default '',
  follow_up_on text,
  notes text not null default '',
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------------------------------------------------------------------------
-- Foster roster: people who foster for the rescue, and every cat they've fostered
-- ---------------------------------------------------------------------------
create table fosters (
  id text primary key,
  application_id text references applications on delete set null,
  name text not null,
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  can_foster text not null default '[]',
  notes text not null default '',
  on_break integer not null default 0,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index fosters_email_idx on fosters (lower(email));

create trigger fosters_updated_at after update on fosters
begin
  update fosters set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') where id = new.id;
end;

create table foster_placements (
  id text primary key,
  foster_id text not null references fosters on delete cascade,
  -- Kept when the cat record is deleted, and used for cats from before the website.
  cat_id text references cats on delete set null,
  cat_name text not null,
  started_on text not null default (date('now')),
  ended_on text,
  notes text not null default '',
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index foster_placements_foster_idx on foster_placements (foster_id, started_on desc);
