const socketIo = require( 'socket.io' )

const { User, Room } = require( '../../db' )
const broadcast = require( '../../src/broadcast' )
const cookie = require('cookie')
const bcrypt = require('bcrypt')
var secretsById = []

const init = ( app, server ) => {
  const io = socketIo( server )

  function rollDice(room_id, user_id_order) {
    var total = []
    var promises = []
    Room.getLastMove(room_id)
    .then (lastMove => {
        const thisRound = lastMove.round+1
        for (let user_id of user_id_order) {
            Room.getPlayerLostDiceAmount(room_id, user_id)
            .then (({losses}) => {
                const numDices = 5-losses
                dices = []
                for (var i = 0; i < numDices; i++) {
                  var tmp = Math.ceil(Math.random()*6);
                  dices.push(tmp);
                  total.push(tmp);
                }
                io.to(secretsById[user_id]).emit('user-roll', {room_id: room_id, roll: dices})
                promises.push(Room.addUserRoll(room_id, user_id, thisRound, dices))
                if (promises.length == user_id_order.length)
                  Promise.all(promises)
                  .then ( _ => Room.addRoundRoll(room_id, thisRound, total) )
                  .then ( _ =>  Room.startRoom(room_id)  )
                  .then( _ =>  Room.inGameStatus(room_id) )
                  .then( room_update =>  io.to(room_id).emit('room-update', room_update))
            })
        }
    })
  }

  function updateLobby() {
      Room.allActive().
      then ( result => {
        io.to('0').emit('lobby-update', result)
      })
  }

  app.set( 'io', io )

  io.on( 'connection', socket => {
    console.log( 'client connected' )
    socket.cookies = cookie.parse(socket.handshake.headers.cookie
         || socket.request.headers.cookie)
    socket.join(socket.cookies.user_secret)
    
    secretsById[socket.cookies.user_id] = socket.cookies.user_secret
    socket.on( 'disconnect', data => {
      console.log( 'client disconnected' )
    })

   socket.on('room-subscribe', room_id => {
        socket.join(room_id)
        if (room_id > 0) {
            Room.inGameStatus(room_id)
            .then( result => {
                socket.emit('room-update', result)
                if (result[0].started) {
                    if (result[0].user_id_order.indexOf(parseInt(socket.cookies.user_id)) > -1) {
                        Room.getLastMove(room_id)
                        .then (lastMove => { 
                            socket.emit('last-move', {roll: lastMove.roll, amount: lastMove.amount})
                        })
                        Room.getUserRoll(room_id, socket.cookies.user_id)
                        .then ( user_roll => {
                            socket.emit('user-roll', {room_id: room_id, roll: user_roll.dice})
                        })
                    }
                }
            })
        }
        Room.getPastChat(room_id)
        .then( result => {
            if (result) {
                for (row in result) {
                    socket.emit('chat', {user_id: result[result.length-1-row].user_id, display_name: result[result.length-1-row].display_name, message: result[result.length-1-row].message})
                }
            }
        })
    })

socket.on('data2', room_id => {
       console.log('data2 called')
       if (room_id > 0) {
            Room.inGameStatus(room_id)
            .then( result => {
                socket.emit('room-update', result)
                if (result[0].started) {
                    if (result[0].user_id_order.indexOf(parseInt(socket.cookies.user_id)) > -1) {
                        Room.getUserRoll(room_id, socket.cookies.user_id)
                        .then ( user_roll => {
                            socket.emit('user-roll', {room_id: room_id, roll: user_roll.dice})
                        })
                    }
                }
            })
        }

    })

    socket.on('data', room_id => {
        console.log('data, room_id: ' + room_id)
        rollDice (room_id, [])
    })

    socket.on('leave-game', ({room_id}) => {
        console.log('leaving')
        if (!room_id || room_id < 1) {
            socket.emit('error-message', {message: 'Invalid action'})
            return;
        }
        Room.findById(room_id)
        .then( result => {
            if (!result || result.started) {
                socket.emit('error-message', {message: 'You cant leave this room'})
            }
            const arrayIndex = result.user_id_order.indexOf(parseInt(socket.cookies.user_id)) 
            if (arrayIndex == -1) {
                socket.emit('error-message', {message: 'Youre not in this room'})
                return;
            }
            if (result.user_id_order.length == 1) {
                io.to(room_id).emit('redirect', {destination: '/'})
                Room.closeRoom(room_id)
                .then( _ => updateLobby())
                return
            }
            result.user_id_order.splice(arrayIndex, 1)
            const promise1 = Room.updateUserIdOrder(room_id, result.user_id_order)
            const promise2 = Room.removeUser(room_id, socket.cookies.user_id)
            var promise3 = promise2
            if (arrayIndex == 0) {
                promise3 = Room.updateMasterUserId(room_id, result.user_id_order[0])
            }
            Promise.all([promise1, promise2, promise3])
            .then ( _ => {
             Room.inGameStatus(room_id)
              .then( room_update => {
                io.to(room_id).emit('room-update', room_update)
              })

 
            })
        })
    })

    socket.on('enter-game', ({room_id}) => {
        if (!room_id || room_id < 1) {
            socket.emit('error-message', {message: 'Invalid action'})
            return;
        }
        Room.findById(room_id)
        .then( result => {
            if (!result || result.started) {
                socket.emit('error-message', {message: 'You cant enter this room'})
            }
            if (result.user_id_order.indexOf(parseInt(socket.cookies.user_id)) > -1) {
                socket.emit('error-message', {message: 'Already in this room'})
                return;
            }
            result.user_id_order.push(socket.cookies.user_id)
            const promise1 = Room.updateUserIdOrder(room_id, result.user_id_order)
            const promise2 = Room.insertUser(room_id, socket.cookies.user_id)
            Promise.all([promise1, promise2])
            .then ( _ => {
              Room.inGameStatus(room_id)
              .then( room_update => {
                io.to(room_id).emit('room-update', room_update)
              })


            })
        })
    })

   socket.on('make-move', ({room_id, roll, amount}) => {
        if (!room_id || room_id < 1 || !roll || !amount || roll < 1 || roll > 6 || amount < 1) {
            socket.emit('error-message', {message: 'Invalid action'})
            return;
        }
        Room.findById(room_id)
        .then( result => {
            if (!result || result.ended) {
                socket.emit('error-message', {message: 'This room doesnt exist anymore'})
                setTimeout(function() {
                   socket.emit('redirect', {destination: '/'})
                }, 5000)
                return;
            }
            if (!result.started) {
                socket.emit('error-message', {message: 'Game not in progress'})
                return;
            }
            if (result.user_id_order[0] != socket.cookies.user_id) {
                socket.emit('error-message', {message: 'This is not your turn'})
                return;
            }
            Room.getLastMove(room_id)
            .then (lastMove => {
              if (amount < lastMove.amount || (amount == lastMove.amount && roll <= lastMove.roll)) {
                socket.emit('error-message', {message: 'Illegal move. Either pick the same amount with a bigger roll or a larger amount with any roll'})
                return;
              }
              var promises = []
              var wildcards = true
              if (lastMove.roll == 0) {
                  lastMove.round += 1
                  if (roll == 1) {
                      promises.push(Room.setNoWildcards(room_id, lsatMove.round))
                  }
              }
              promises.push(Room.insertMove(room_id, socket.cookies.user_id, lastMove.round, roll, amount))
              result.user_id_order.push(result.user_id_order.shift())
              promises.push(Room.updateUserIdOrder(room_id, result.user_id_order))
              
              Promise.all(promises)
              .then ( _ => {
                  io.to(room_id).emit('last-move', {roll: roll, amount: amount})
                  io.to(room_id).emit('chat', {user_id: '0', display_name: 'Game', message: 'Player ' + socket.cookies.display_name + '#' + socket.cookies.user_id + ' called amount ' + amount + ' and roll ' + roll})
                  return Room.inGameStatus(room_id)
              }).then( room_update =>  io.to(room_id).emit('room-update', room_update))
            })


        })
    })
 socket.on('start-game', ({room_id}) => {
        if (!room_id || room_id < 1) {
            socket.emit('error-message', {message: 'Invalid action'})
            return;
        }
        Room.findById(room_id)
        .then( result => {
            if (!result || result.ended) {
                socket.emit('error-message', {message: 'This room doesnt exist anymore'})
                setTimeout(function() {
                   socket.emit('redirect', {destination: '/'})
                }, 5000)
                return;
            }
            if (socket.cookies.user_id != result.master_user_id) {
                socket.emit('error-message', {message: 'Only the leader may start a game'})
                return;
            }
            if (result.user_id_order.length < 2) {
                socket.emit('error-message', {message: 'You need at least 2 players to start a game'})
                return;
            }
            if (result.started) {
                socket.emit('error-message', {message: 'Game already in progress'})
                return;
            }
            Room.insertMove(room_id, socket.cookies.user_id, 0, 0, 0)
            .then ( _ => {
                rollDice(room_id, result.user_id_order)
            })


        })
    })
  
    socket.on( 'chat', ({room_id, message}) => {
        const cookies = socket.cookies
        Room.insertMessage(room_id, cookies.user_id, message)
        .then( _ => io.to(room_id).emit('chat', {user_id: cookies.user_id, display_name: cookies.display_name, message: message}))
    })


    socket.on( 'create-room', ({room_name}) => {
        const cookies = socket.cookies
        Room.createRoom(cookies.user_id, room_name, 5, [parseInt(cookies.user_id)])
        .then( result => {
            Room.insertUser(result.id, cookies.user_id)
            .then( _ => { 
                socket.emit('redirect', {destination: '/room/' + result.id})
                updateLobby()
            })
        })
    })


    socket.on( 'login', data => {
        User.findByUsername(data.username)
        .then ( result => {
            if (!result || data.username.length == 0) {
                socket.emit( 'error-message', {message: 'Wrong login/password combination'})
            } else {
               bcrypt.compare(data.password, result.password)
                .then( check => {
                    if (!check) {
                        socket.emit( 'error-message', {message: 'Wrong Login, did you want to register instead?'})
                    } else {
                        const red = 'login/'+data.username+'/'+data.password
                        socket.emit('redirect', {destination: red})
                    }
                })
            }
        })
    })

  socket.on( 'signup', data => {
        const cookies = socket.cookies
        User.checkIfRegistered(cookies.user_id, data.username)
        .then ( result => {
            if (result.length > 0) {
                socket.emit( 'error-message', {message: 'Username already registered'})
            } else {
               const hash = bcrypt.hash(data.password, 10)
                .then( hash => {
                    User.register(hash, data.username, cookies.user_id)
                    .then ( _ => socket.emit( 'redirect', {destination: '/'}) )
                })
            }
        })
    })

    socket.on( 'display-name-update', ({display_name}) => {
        const cookies = socket.cookies
        User.updateDisplayName(display_name, cookies.user_id)
        .then( result => {
            if (result.length == 0) {
                socket.emit( 'error-message', {message: 'An error has occurred'})
            } else {
                socket.cookies.display_name = result.display_name

                /*if (socket.handshake.headers.cookie) {
                    socket.handshake.headers.cookie = result.display_name
                }
                if (socket.request.headers.cookie) {
                    socket.request.headers.cookie = result.display_name
                }*/
                socket.emit ( 'update-name', {display_name: result.display_name, id: result.id})
            }
        })
        //socket.emit( 'success', {message: 'success message'})
    })

/*     socket.on( 'data', data => {
        console.log(data)
        //socket.emit( 'success', {message: 'success message'})
        Room.allActive().
        then ( result => {
            io.to('0').emit('lobby-update', result)
            console.log(result)
        })
    })*/
  })
}

module.exports = { init }
