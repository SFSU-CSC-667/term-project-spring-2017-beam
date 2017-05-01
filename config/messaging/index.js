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

    socket.on( 'signup', data => {
        const cookies = cookie.parse(socket.handshake.headers.cookie
                || socket.request.headers.cookie)
        User.checkIfRegistered(cookies.user_id, data.email) 
        .then ( result => { 
            if (result.length > 0) {
                socket.emit( 'error', {message: 'Email in use or ID already registered'})
            } else {
               const hash =  'oi'
            }
        })
    })

    socket.on( 'data', data => {
        console.log(data)
    })

    socket.on( 'please-create-user', data => {
      User.create( data.email )
        .then( user => broadcast( io, 'user-created', user ))
    })
  })
}

module.exports = { init }
