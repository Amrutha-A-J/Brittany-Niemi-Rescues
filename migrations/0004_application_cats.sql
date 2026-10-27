-- An application can be for several cats. applications.cat_id stays as the first choice
-- (adoption pages and filters use it); this table lists every chosen cat, in order.
create table application_cats (
  application_id text not null references applications on delete cascade,
  cat_id text not null references cats on delete cascade,
  position integer not null default 0,
  primary key (application_id, cat_id)
);
create index application_cats_cat_idx on application_cats (cat_id);

insert into application_cats (application_id, cat_id)
select id, cat_id from applications where cat_id is not null;
