const socketIo = require( 'socket.io' )

const { User } = require( '../../db' )
const broadcast = require( '../../src/broadcast' )

const init = ( app, server ) => {
  const io = socketIo( server )

  app.set( 'io', io )

  io.on( 'connection', socket => {
    console.log( 'client connected' )

    socket.on( 'disconnect', data => {
      console.log( 'client disconnected' )
    })

    socket.on( 'please-create-user', data => {
      User.create( data.email )
        .then( user => broadcast( io, 'user-created', user ))
    })
  })
}

module.exports = { init }