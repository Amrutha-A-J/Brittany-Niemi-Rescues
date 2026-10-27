-- Website wording the rescue edits in the admin (Admin → Website settings).
-- A missing key falls back to the default in src/lib/site-text.ts.
create table site_text (
  key text primary key,
  value text not null,
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
