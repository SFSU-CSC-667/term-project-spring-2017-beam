const socketIo = require( 'socket.io' )

const { User, Room } = require( '../../db' )
const broadcast = require( '../../src/broadcast' )
const cookie = require('cookie')
const bcrypt = require('bcrypt')

const init = ( app, server ) => {
  const io = socketIo( server )

  app.set( 'io', io )

  io.on( 'connection', socket => {
    console.log( 'client connected' )
    const test = socket.handshake.headers.cookie || socket.request.headers.cookie

    socket.on( 'disconnect', data => {
      console.log( 'client disconnected' )
    })

    socket.on( 'lobby-chat', ({message}) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie
                || socket.request.headers.cookie)
        Room.insertMessage(0, cookies.user_id, message)
        .then( _ => io.emit('lobby-chat', {user_id: cookies.user_id, display_name: cookies.display_name, message: message}))
    })


    socket.on( 'login', data => {
        User.findByUsername(data.username)
        .then ( result => {
            if (!result || data.username.length == 0) {
                socket.emit( 'errorMessage', {message: 'Wrong login/password combination'})
            } else {
               bcrypt.compare(data.password, result.password)
                .then( check => {
                    if (!check) {
                        socket.emit( 'errorMessage', {message: 'Wrong Login, did you want to register instead?'})
                    } else {
                        const red = 'login/'+data.username+'/'+data.password
                        socket.emit('redirect', {destination: red})
                    }
                })
            }
        })
    })

  socket.on( 'signup', data => {
        const cookies = cookie.parse(socket.handshake.headers.cookie
                || socket.request.headers.cookie)
        User.checkIfRegistered(cookies.user_id, data.username)
        .then ( result => {
            if (result.length > 0) {
                socket.emit( 'errorMessage', {message: 'Username already registered'})
            } else {
               const hash = bcrypt.hash(data.password, 10)
                .then( hash => {
                    User.register(hash, data.username, cookies.user_id)
                    .then ( _ => socket.emit( 'redirect', {destination: '/'}) )
                })
            }
        })
    })

    socket.on( 'data', data => {
        console.log(data)
        //socket.emit( 'success', {message: 'success message'})
    })
  })
}

module.exports = { init }
