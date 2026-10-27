-- The map link sent with a meet & greet, so its calendar file (/calendar/<id>.ics) can include it.
alter table meetings add column map_url text not null default '';
