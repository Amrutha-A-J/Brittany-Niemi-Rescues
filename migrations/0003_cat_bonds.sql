-- Bonded cats: cats that must be adopted together. Each bond is stored both ways
-- (Pip → Rosie and Rosie → Pip), so a cat's partners are `where cat_id = ?`.
create table cat_bonds (
  cat_id text not null references cats on delete cascade,
  bonded_id text not null references cats on delete cascade,
  primary key (cat_id, bonded_id)
);
