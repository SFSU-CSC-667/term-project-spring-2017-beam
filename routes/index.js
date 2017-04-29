var express = require('express');
var router = express.Router();
var debug = true;
const bcrypt = require('bcrypt');
var Pool = require('pg').Pool;
var pool = new Pool({   
    user: 'group667',
    password: 'jkjkjk',
    host: 'localhost',
    database: 'group667',
    max: 30, // max number of clients in pool
    idleTimeoutMillis: 1000, // close & remove clients which have been idle > 1 second
});
var randomstring = require ('randomstring');


function createTempUserIfNeeded(req, res, next) {
    if (debug) console.log('createTempUserIfNeeded function called');
    if (!req.cookies.user_id && !req.cookies.user_secret) {
        var secret = randomstring.generate(60);
        pool.query('INSERT into users (display_name, secret, registered) values ($1, $2, false) returning id', ['Guest', secret], function(err, result) {
            req.cookies.user_id = result.rows[0].id;
            req.cookies.user_secret = secret;
            req.cookies.display_name = 'Guest';
            res.cookie('display_name', 'Guest');
            res.cookie('user_secret', secret);
            res.cookie('user_id', result.rows[0].id);
            next();
        });
    } else {
        next();
    }
}




function checkAuth(req, res, next) {
    //authentication stuff
    if (debug) console.log('checkAuth function called'); 
    const data = {user_id: req.cookies.user_id, user_secret: req.cookies.user_secret};
    pool.query('SELECT * FROM users WHERE id=$1 and secret=$2',
            [data.user_id, data.user_secret], function(err, result) {
                if (result.rowCount == 0) {
                    res.clearCookie('user_secret');
                    res.clearCookie('user_id');
                    return res.status(403).json();
                } else {
                    next();
                }});
}


function getGameInfo (req, res, next) {
    if (debug) console.log('getGameInfo function called'); 
    const data = {room_id: req.params.game_id};
    pool.query('SELECT * FROM rooms WHERE id=$1',
            [data.room_id], function(err, result) {
                req.gameExists = (result.rowCount > 0);
                if (req.gameExists) {
                    req.master_user_id = result.rows[0].master_user_id;
                    req.gameStarted = result.rows[0].started;
                    req.gameEnded = result.rows[0].ended;
                    req.user_id_order = result.rows[0].user_id_order;
                    req.room_name = result.rows[0].name;
                    req.room_id = data.room_id;
                }
                if (debug) {
                    console.log('gameExists? ' + req.gameExists);
                    console.log('gameMasterUserId? ' + req.master_user_id);
                    console.log('gameStarted? '+ req.gameStarted);
                    console.log('gameEnded? '+ req.gameEnded);
                }
                next();
            });
}


function checkIfInGame (req, res, next) {
    if (debug) console.log('checkIfInGame function called'); 
    if (!req.gameExists) {
        req.inGame = false;
        next();
        return;
    }
    const data = {room_id: req.params.game_id, user_id: req.cookies.user_id};
    pool.query('SELECT * FROM room_users WHERE room_id=$1 and user_id=$2',
            [data.room_id, data.user_id], function(err, result) {
                req.inGame = (result.rowCount > 0);
                if (debug) console.log('inGame? ' + req.inGame);
                next();
            });
}


function gameEnterFunction (req, res, next) {
    // Grab data from http request
    if (debug) console.log('gameEnterFunction called'); 
    if (!req.gameExists || req.inGame || req.gameStarted) {
        if (debug) console.log('game doesnt exist or already in game or game already started');
        return res.status(204).json();
    }
    const data = {room_id: req.params.game_id, user_id: req.cookies.user_id};
    // Get a Postgres client from the connection pool

    req.user_id_order.push(data.user_id);
    pool.query('UPDATE rooms SET user_id_order = $1 WHERE id=$2',
            [req.user_id_order,data.room_id]);
    pool.query('INSERT into room_users (room_id,user_id) values ($1,$2) ON CONFLICT DO NOTHING',
            [data.room_id, data.user_id]);
    return res.json();

    //TODO - generic - update everyone involved in last return
    //render game, update screen for other players

}

function registerFunction (req, res, next) {
    if (debug) console.log('registerFunction called');
    const data = {email: req.body.email, password: req.body.password, user_id:  req.cookies.user_id};
    if (!data.email || !data.password) {
        return res.status(400).json();
    }
    pool.query('SELECT * from users WHERE (id=$1 AND registered=true) OR email=$2',
            [data.user_id, data.email], function (err, result) {
                if (result.rowCount > 0) {
                    return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //username already registered, redirect to error page
                } else {
                    bcrypt.hash(data.password, 10, function(err, hash) {
                        pool.query('UPDATE users SET password=$1, email=$2, registered=true WHERE id=$3',
                                [hash, data.email, data.user_id], function (err, result) {
                                    return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //success screen for registration
                                });
                    });
                }
            });
}

function loginFunction (req, res, next) {
    if (debug) console.log('loginFunction called');
    const data = {email: req.body.email, password: req.body.password, user_id:  req.cookies.user_id};
    if (!data.email || !data.password) {
        return res.status(400).json();
    }
    pool.query('SELECT * from users WHERE email=$1',
            [data.email], function (err, result) {
                if (result.rowCount == 0) {
                    return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //email doesnt exist
                } else {
                    bcrypt.compare(data.password, result.rows[0].password, function(err, passwordCheck) {
                        if (passwordCheck) {
                            res.cookie('user_id',result.rows[0].id);
                            res.cookie('user_secret',result.rows[0].secret);
                            res.cookie('display_name',result.rows[0].display_name);
                            return res.status(200).json();
    //TODO - generic - update everyone involved in last return
    //sucessfull login
                        } else {
                            return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //bad password
                        }
                    });
                }
            });
}

function editUserFunction (req, res, next) {
    if (debug) console.log('editUserFunction called');
    const data = {display_name: req.body.display_name, user_id: req.cookies.user_id};
    if (data.display_name) {
        if (debug) console.log('display_name? ' + data.display_name);
        pool.query('UPDATE users SET display_name=$1 WHERE id=$2 RETURNING *',
                [data.display_name, data.user_id], function (err, result) {
                    req.cookies.display_name = data.display_name;
                    res.cookie('display_name',data.display_name);
                    return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //updated display_name
                });
    } else {
        return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    // maybe 204 is ok here? i dont know. maybe nothing
    }
}

function gameCreateFunction (req, res, next) {
    if (debug) console.log('gameCreateFunction called');
    const data = {room_name: req.body.room_name || 'New room',
        max_players: req.body.max_players || 5};
    if (data.max_players > 5) data.max_players = 5;
    pool.query('INSERT into rooms (master_user_id, name, max_players, created, user_id_order) values ($1, $2, $3, CURRENT_TIMESTAMP, $4) returning id', [req.cookies.user_id, data.room_name, data.max_players, []], function(err, result) {
        return res.redirect('/game/' + result.rows[0].id + '/enter');
    });

}

function gameRemoveFunction (req, res, next) {
    // Grab data from http request
    if (debug) console.log('gameRmoveFunction called'); 
    const data = {room_id: req.params.game_id, user_id: req.cookies.user_id, target_user_id: req.body.target_user_id};
    if (!req.gameExists || !req.inGame || req.gameStarted || (data.target_user_id != data.user_id && data.user_id != req.master_user_id)) {
        if (debug) console.log('cant remove from game');
        return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //maybe no response? i dont know. gotta check sockets
    }
    // Get a Postgres client from the connection pool

    var indexInArray = req.user_id_order.indexOf(parseInt(data.target_user_id));
    if (indexInArray > -1) {
        req.user_id_order.splice(indexInArray,1);
        if (req.user_id_order.length > 0) {
            if (data.master_user_id == data.target_user) {
                data.master_user_id = req.user_id_order[0];
            }
            pool.query('UPDATE rooms SET user_id_order = $1, master_user_id=$2 WHERE id=$3',
                    [req.user_id_order,data.master_user_id,data.room_id]);
        } else {
            pool.query('UPDATE rooms SET user_id_order = $1, started=CURRENT_TIMESTAMP, ended=CURRENT_TIMESTAMP WHERE id=$2',
                    [req.user_id_order,data.room_id]);
        }
        pool.query('DELETE from room_users WHERE room_id = $1 and user_id = $2',
                [data.room_id, data.target_user_id], function(err, result) {

                });
    } 
    return res.json();
    //TODO - generic - update everyone involved in last return
    // update everyone after removing player

}

function gameMoveFunction (req, res, next) {
    if (debug) console.log('gameMoveFunction called');
    const data = {roll: parseInt(req.body.roll),
        amount: parseInt(req.body.amount),
        user_id: req.cookies.user_id,
        room_id: req.room_id,
        user_id_order: req.user_id_order,
        master_user_id: req.master_user_id};
    if (!req.gameExists) {
        return res.status(204).json();
    }
    //game exists
    //roll 7 = start the game
    //roll 8 = call liar
    //roll 9 = lost dice
    //roll 0 (database only) = marks last "ended" round

    if (req.gameEnded) {
        return res.status(204).json();
    }

    if (!req.gameStarted) {
        if (data.master_user_id == req.cookies.user_id && data.roll == 7 && data.user_id_order.length > 1) {
            //game start logic goes here
            insertMove(data.room_id, data.user_id,0,0,0);

            rollDice(data.room_id,data.user_id_order);
            return res.json();
    //TODO - generic - update everyone involved in last return
    //update everyone involved, start the game, render yada yada
        } else {
            return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //maybe no response
        }
    }
    //at this point, the game is being played
    if (data.user_id_order[0] != data.user_id) {
        return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //maybe no respone
    }

    if (data.roll < 1 || data.roll > 8 || data.roll == 7) {
    //TODO - generic - update everyone involved in last return
    //maybe no respone
        return res.status(204).json();
    }
    if (data.roll == 8) {
        //liar call
        getRoundRoll (data.room_id, function (roundRoll) {
            getLastMoveFromRoom (data.room_id, function (lastMove) {
                if (roundRoll.round != lastMove.round) {
                    return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //maybe no respone
                }
                var count = {};

                roundRoll.dice.forEach(function(el){
                        count[el] = count[el] + 1 || 1;
                });
                //sourced from http://stackoverflow.com/questions/17313268/efficiently-find-the-number-of-occurrences-a-given-value-has-in-an-array


                var realAmount = count[lastMove.roll] || 0;
                if (roundRoll.has_wildcards) {
                    realAmount += count[1] || 0;
                }

                var loser;
                if (lastMove.amount > realAmount) {
                    loser = lastMove.user_id;
                } else {
                    loser = data.user_id;
                    data.user_id_order.unshift(data.user_id_order.pop());
                }


                getAmountOfLossesOf (data.room_id, loser, function (losses) {
                    if (losses == 4) {
                        //lost 4 before + this one, get out of game
                        data.user_id_order.splice(data.user_id_order.indexOf(loser), 1);
                    }
                    insertMove(data.room_id, data.user_id, lastMove.round, 8, 0);
                    insertMove(data.room_id, loser, lastMove.round, 9, 0);
                    insertMove(data.room_id, data.user_id, lastMove.round, 0, 0);
                    updateUserIdOrder(data.room_id, data.user_id_order);
                    if (data.user_id_order.length == 1) {
                        //TODO endgame
                        return res.json();
    //TODO - generic - update everyone involved in last return
                    } else {
                        rollDice(data.room_id, data.user_id_order);
                        return res.json();
    //TODO - generic - update everyone involved in last return
    //re render everyone
                    }
                });

            });
        });

    }

    if (data.roll < 7) {
        getLastEndedRoundFromRoom (data.room_id, function (lastRound) {
            getLastMoveFromRoom (data.room_id, function (lastMove) {
                if (lastMove.round == lastRound && roll == 1) {
                    //remove wildcards
                    pool.query('UPDATE round_rolls SET has_wildcards = false WHERE room_id = $1 AND round = $2',
                            [data.room_id,lastRound+1]);

                }
                if (lastMove.round == lastRound) {
                    insertMove(data.room_id, data.user_id, lastRound+1, data.roll, data.amount);
                    data.user_id_order.push(data.user_id_order.shift());
                    updateUserIdOrder(data.room_id, data.user_id_order);
                } else {

                    if (data.amount > lastMove.amount || (data.amount == lastMove.amount && data.roll > lastMove.roll)) {
                        insertMove(data.room_id, data.user_id, lastRound+1, data.roll, data.amount);
                        data.user_id_order.push(data.user_id_order.shift());
                        updateUserIdOrder(data.room_id, data.user_id_order);

                    } else {
                        return res.status(204).json();
    //TODO - generic - update everyone involved in last return
    //maybe no action. illegal move

                    }
                }
                return res.status(200).json();
    //TODO - generic - update everyone involved in last return
    //a move was made, update people
            });
        });
    } else {
        //should never reach here
        return res.status(204).json();

    }


    /*
       pool.query('INSERT into rooms (master_user_id, name, max_players, created, user_id_order) values ($1, $2, $3, CURRENT_TIMESTAMP, $4) returning id', [req.cookies.user_id, data.room_name, data.max_players, []], function(err, result) {
       return res.redirect('/game/' + result.rows[0].id + '/enter');
       });*/

}

function updateUserIdOrder (room_id, user_id_order) {
    pool.query('UPDATE rooms SET user_id_order = $1 WHERE room_id = $2',
            [user_id_order, room_id]);
}

function getLastMoveFromRoom (room_id, callback) {
    pool.query('SELECT * FROM moves WHERE room_id = $1 ORDER BY time DESC',
            [room_id], function (err, result) {
                callback(result.rows[0]);
            });
}

function getRoundRoll (room_id, callback) {
    pool.query('SELECT * FROM round_rolls WHERE room_id = $1 ORDER BY round DESC',
            [room_id], function (err, result) {
                callback(result.rows[0]);
            });
}

function getLastEndedRoundFromRoom (room_id, callback) {
    pool.query('SELECT round FROM moves WHERE room_id = $1 AND roll = 0 ORDER BY round DESC',
            [room_id], function (err, result) {
                callback(result.rows[0].round);
            });
}

function getAmountOfLossesOf (room_id, user_id, callback) {
    pool.query('SELECT count (*) as losses FROM moves WHERE room_id = $1 AND user_id = $2 AND roll = 9',
            //9 roll = lost a dice
            [room_id, user_id], function (err, result) {
                callback(result.rows[0].losses);
            });
}


function rollDice(room_id, user_id_order) {
    var total = [];
    getLastMoveFromRoom(room_id, function (lastMove) {
        thisRound = lastMove.round+1;
        if (debug) console.log('thisRound? ' + thisRound);
        for (let user_id of user_id_order) {
            getAmountOfLossesOf(room_id, user_id, function (losses) {
                var numDices = 5-losses;
                if (debug) console.log('numDices? ' + numDices);
                var dices = [];
                for (var i = 0; i < numDices; i++) {
                    var tmp = Math.ceil(Math.random()*6);
                    dices.push(tmp);
                    total.push(tmp);
                }
                pool.query('INSERT into user_rolls values ($1, $2, $3, $4) ON CONFLICT (room_id, user_id, round) DO UPDATE SET dice = $4',
                        [room_id, user_id, thisRound, dices]);
                if (debug) console.log(total);
                pool.query('INSERT into round_rolls values ($1, $2, true, $3) ON CONFLICT (room_id, round) DO UPDATE SET dice = $3',
                        [room_id, thisRound, total]);


            });
        }
    });

}
function insertMove(room_id, user_id, round, roll, amount) {
    pool.query('INSERT into moves (room_id, user_id, round, roll, amount, time) values ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
            [room_id, user_id, round, roll, amount], function (err, result) {
                return;

            });
}

router.use(createTempUserIfNeeded);
router.use(checkAuth);

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.all('/game/create', gameCreateFunction);
router.all('/game/:game_id/enter', getGameInfo, checkIfInGame, gameEnterFunction);
router.all('/game/:game_id/move', getGameInfo, checkIfInGame, gameMoveFunction);
router.all('/game/:game_id/remove_user', getGameInfo, checkIfInGame, gameRemoveFunction);
router.all('/user/login', loginFunction);
router.all('/user/register', registerFunction);
router.all('/user/edit', editUserFunction);
router.get('/create', function(req, res, next) {
    res.render('index', { title: req.cookies.display_name});
});

module.exports = router;
