drop table if exists users;
create table users (
  id serial primary key,
  email varchar(256) not null
);