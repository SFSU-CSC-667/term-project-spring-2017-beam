DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS room_users CASCADE;
DROP TABLE IF EXISTS user_rolls CASCADE;
DROP TABLE IF EXISTS round_rolls CASCADE;
DROP TABLE IF EXISTS moves CASCADE;

CREATE TABLE IF NOT EXISTS chat_messages
(
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    time TIMESTAMP NOT NULL,
    message VARCHAR(140),
    CONSTRAINT PK_chat_messages PRIMARY KEY (room_id, user_id, time)   
);

CREATE TABLE IF NOT EXISTS users
(
    id SERIAL NOT NULL,
    username VARCHAR(60),
    password VARCHAR(60),
    display_name VARCHAR(25) NOT NULL,
    registered BOOLEAN NOT NULL,
    secret VARCHAR(60),
    CONSTRAINT PK_users PRIMARY KEY(id)
);
insert INTO users (id,display_name,secret,registered) values
    (0,'Lobby','akfugasbi8v7aviasiv67asf67va',true);
INSERT INTO users (display_name,secret,registered) values
    ('Guest1','askdnasdnas',false),
    ('Guest2','askdnasdnas',false),
    ('Guest3','askdnasdnas',false),
    ('Guest4','askdnasdnas',false),
    ('Guest5','askdnasdnas',false),
    ('Guest6','askdnasdnas',false);

CREATE TABLE IF NOT EXISTS rooms
(
    id SERIAL NOT NULL,
    master_user_id INTEGER NOT NULL,
    name VARCHAR(60) NOT NULL,
    max_players INTEGER NOT NULL,
    created TIMESTAMP NOT NULL,
    started TIMESTAMP,
    ended TIMESTAMP,
    user_id_order integer[],
    CONSTRAINT PK_rooms PRIMARY KEY(id)
);
insert into rooms (id,master_user_id, max_players, name, created, user_id_order) values (0,0,9999,'lobby',CURRENT_TIMESTAMP,'{0}');
INSERT into rooms (master_user_id,name,max_players,created,started,user_id_order) values
    (1,'room1_lobby',4,CURRENT_TIMESTAMP,null,array[1,2,3]),
    (4,'room2_roundstart',2,CURRENT_TIMESTAMP - INTERVAL '99' SECOND,CURRENT_TIMESTAMP - INTERVAL '98' SECOND,array[4,5]),
    (6,'room3_roundinprogress',2,CURRENT_TIMESTAMP - INTERVAL '99' SECOND,CURRENT_TIMESTAMP - INTERVAL '98' SECOND,array[6,1]),
    (2,'room4_endgame',2,CURRENT_TIMESTAMP - INTERVAL '99' SECOND,CURRENT_TIMESTAMP - INTERVAL '98' SECOND,array[2,3]);

CREATE TABLE IF NOT EXISTS room_users
(
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    CONSTRAINT PK_room_users PRIMARY KEY (room_id, user_id)
);
INSERT into room_users (room_id,user_id) values 
    (1,1),
    (1,2),
    (1,3),
    (2,4),
    (2,5),
    (3,6),
    (3,1),
    (4,2),
    (4,3);

CREATE TABLE IF NOT EXISTS user_rolls
(
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    dice integer[],
    CONSTRAINT PK_user_rolls PRIMARY KEY (room_id, user_id, round)
);
INSERT into user_rolls (room_id,user_id,round,dice) values
    (2,4,1,array[1,2,3,4,5]),
    (2,5,1,array[1,2,3,4,6]),
    (3,6,1,array[1,2,3,6,6]),
    (3,1,1,array[1,2,3,6,6]),
    (4,2,1,array[2]),
    (4,3,1,array[2,2,2,2]);

CREATE TABLE IF NOT EXISTS round_rolls
(
    room_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    has_wildcards BOOLEAN NOT NULL,
    dice integer[],
    CONSTRAINT PK_round_rolls PRIMARY KEY (room_id, round)
);
INSERT into round_rolls (room_id,round,has_wildcards,dice) values
    (2,1,true,array[1,1,2,2,3,3,4,4,5,6]),
    (3,1,true,array[1,1,2,2,3,3,6,6,6,6]),
    (4,1,true,array[2,2,2,2,2]);

CREATE TABLE IF NOT EXISTS moves
(
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    round INTEGER NOT NULL,
    roll INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    time TIMESTAMP NOT NULL
);
INSERT into moves (room_id,user_id,round,amount,roll,time) values
    (3,6,1,3,2,CURRENT_TIMESTAMP - INTERVAL '97' SECOND),
    (3,1,1,4,3,CURRENT_TIMESTAMP - INTERVAL '96' SECOND),
    (4,2,1,4,3,CURRENT_TIMESTAMP - INTERVAL '97' SECOND);

-- Create FKs
ALTER TABLE rooms ADD CONSTRAINT FK_master_user_id
    FOREIGN KEY (master_user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE chat_messages ADD CONSTRAINT FK_chat_messages_room_id
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE NO ACTION ON UPDATE NO ACTION;
    
ALTER TABLE chat_messages ADD CONSTRAINT FK_chat_messages_user_id
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE room_users ADD CONSTRAINT FK_room_users_room_id
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE room_users ADD CONSTRAINT FK_room_users_user_id
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION;    

ALTER TABLE user_rolls ADD CONSTRAINT FK_user_rolls_user_id
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE user_rolls ADD CONSTRAINT FK_user_rolls_room_id
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE round_rolls ADD CONSTRAINT FK_round_rolls_room_id
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE moves ADD CONSTRAINT FK_moves_user_id
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE NO ACTION ON UPDATE NO ACTION;
    
ALTER TABLE moves ADD CONSTRAINT FK_moves_room_id
    FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE NO ACTION ON UPDATE NO ACTION;


