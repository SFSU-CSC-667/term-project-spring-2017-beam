drop table if exists dogs;
create table dogs (
  id serial primary key,
  user_id serial references users(id),
  name varchar(256) not null
);