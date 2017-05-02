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
    console.log(test)

    socket.on( 'disconnect', data => {
      console.log( 'client disconnected' )
    })

    socket.on( 'lobby-chat', ({message}) => {
        console.log(message)
        const cookies = cookie.parse(socket.handshake.headers.cookie
                || socket.request.headers.cookie)
        Room.insertMessage(0, cookies.user_id, message)
        .then( _ => io.emit('lobby-chat', {user_id: cookies.user_id, display_name: cookies.display_name, message: message}))
    })


    socket.on( 'signup', data => {
        const cookies = cookie.parse(socket.handshake.headers.cookie
                || socket.request.headers.cookie)
        User.checkIfRegistered(cookies.user_id, data.email)
        .then ( result => {
            if (result.length > 0) {
                socket.emit( 'errorMessage', {message: 'Email in use or ID already registered'})
            } else {
               const hash = bcrypt.hash(data.password, 10)
                .then( hash => {
                    User.register(hash, data.email, cookies.user_id)
                    .then ( _ => socket.emit( 'redirect', {destination: '/'}) )
                })
            }
        })
    })

    socket.on( 'data', data => {
        console.log(data)
        socket.emit( 'sucess', {message: 'sucess message'})
    })

    socket.on( 'please-create-user', data => {
      User.create( data.email )
        .then( user => broadcast( io, 'user-created', user ))
    })
  })
}

module.exports = { init }
