DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users
(
   id            serial    NOT NULL,
   email         varchar,
   password      varchar,
   display_name  varchar,
   registered    boolean
);

-- Column id is associated with sequence public.users_id_seq
ALTER TABLE public.users OWNER TO group667;

ALTER TABLE users
   ADD CONSTRAINT users_pkey
   PRIMARY KEY (id);

GRANT TRIGGER, TRUNCATE, INSERT, UPDATE, DELETE, REFERENCES, SELECT ON users TO group667;

COMMIT;
DROP TABLE IF EXISTS rooms CASCADE;

CREATE TABLE rooms
(
   id            serial      NOT NULL,
   master_id     integer,
   name          varchar,
   max_players   integer,
   roles_id      integer[],
   created_date  date,
   started_date  date,
   ended_date    date
);

-- Column id is associated with sequence public.rooms_id_seq
ALTER TABLE public.rooms OWNER TO group667;

ALTER TABLE rooms
   ADD CONSTRAINT rooms_pkey
   PRIMARY KEY (id);

ALTER TABLE rooms
  ADD CONSTRAINT rooms_master_id_fkey FOREIGN KEY (master_id)
  REFERENCES users (id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

GRANT TRIGGER, TRUNCATE, INSERT, UPDATE, DELETE, REFERENCES, SELECT ON rooms TO group667;

COMMIT;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles
(
   id              serial    NOT NULL,
   name            varchar,
   image_location  varchar,
   priority        integer,
   description     varchar
);

-- Column id is associated with sequence public.roles_id_seq
ALTER TABLE public.roles OWNER TO group667;

ALTER TABLE roles
   ADD CONSTRAINT roles_pkey
   PRIMARY KEY (id);

GRANT TRIGGER, TRUNCATE, INSERT, UPDATE, DELETE, REFERENCES, SELECT ON roles TO group667;

COMMIT;
DROP TABLE IF EXISTS chat_messages CASCADE;

CREATE TABLE chat_messages
(
   room_id  integer,
   user_id  integer,
   sent_at  time,
   message  varchar
);

ALTER TABLE public.chat_messages OWNER TO group667;

ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id)
  REFERENCES rooms (id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users (id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

GRANT TRIGGER, TRUNCATE, INSERT, UPDATE, DELETE, REFERENCES, SELECT ON chat_messages TO group667;

COMMIT;
DROP TABLE IF EXISTS room_user_role CASCADE;

CREATE TABLE room_user_role
(
   room_id     integer,
   user_id     integer,
   role_id     integer,
   join_time   date,
   target_ids  integer[]
);

ALTER TABLE public.room_user_role OWNER TO group667;

ALTER TABLE room_user_role
  ADD CONSTRAINT room_user_role_role_id_fkey FOREIGN KEY (role_id)
  REFERENCES roles (id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

ALTER TABLE room_user_role
  ADD CONSTRAINT room_user_role_room_id_fkey FOREIGN KEY (room_id)
  REFERENCES rooms (id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

ALTER TABLE room_user_role
  ADD CONSTRAINT room_user_role_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES users (id)
  ON UPDATE NO ACTION
  ON DELETE NO ACTION;

ALTER TABLE room_user_role
   ADD CONSTRAINT single_entry UNIQUE (room_id, user_id);



GRANT TRIGGER, TRUNCATE, INSERT, UPDATE, DELETE, REFERENCES, SELECT ON room_user_role TO group667;

COMMIT;

