--insert into room_id (1) the user user_id (4)
INSERT into room_users (room_id,user_id) values
    (1,4);
UPDATE rooms SET user_id_order = array_append((SELECT user_id_order from rooms WHERE id=1),4) WHERE id=1;


--remove from room_id(1) the user_id (2)
DELETE from room_users WHERE room_id=1 AND user_id=2;
UPDATE rooms SET user_id_order = array_remove((SELECT user_id_order from rooms WHERE id=1),2) WHERE id=1;

--start game at room id (1)
--set rooms start time, insert rolls into usersRolls and roundRolls
UPDATE rooms SET started=CURRENT_TIMESTAMP WHERE id=1;
INSERT INTO user_rolls values 
    (1,1,1,array[1,2,3,4,5]),
    (1,2,1,array[1,2,3,4,5]),
    (1,3,1,array[1,2,3,4,5]);
INSERT into round_rolls values
    (1,1,true,array[1,1,1,2,2,2,3,3,3,4,4,4,5,5,5]);

--room_id 2, user_id 4, round 1, amount 3, roll 1
--if this is the fisrt move, update round_rolls. otherwise, insert move
UPDATE round_rolls SET has_wildcards=false WHERE room_id=2 AND round=1;
INSERT into moves values
    (2,4,1,3,1,CURRENT_TIMESTAMP);
    

--calling "liar" puts a 0,0 for roll and amount
INSERT into moves values
    (3,6,1,0,0);
