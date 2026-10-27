-- Admin settings that aren't website wording (Admin → Account), e.g. where new-application emails go.
-- A missing key falls back to the default in src/lib/settings.ts.
create table settings (
  key text primary key,
  value text not null,
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
