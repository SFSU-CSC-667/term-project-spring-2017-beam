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
    socket.cookies = cookie.parse(socket.handshake.headers.cookie
         || socket.request.headers.cookie)

    socket.on( 'disconnect', data => {
      console.log( 'client disconnected' )
    })

    socket.on( 'lobby-chat', ({message}) => {
        const cookies = socket.cookies
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
        const cookies = socket.cookies
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

    socket.on( 'display_name_update', ({display_name}) => {
        const cookies = socket.cookies
        User.updateDisplayName(display_name, cookies.user_id)
        .then( result => {
            if (result.length == 0) {
                socket.emit( 'errorMessage', {message: 'An error has occurred'})
            } else {
                socket.cookies.display_name = result.display_name

                /*if (socket.handshake.headers.cookie) {
                    socket.handshake.headers.cookie = result.display_name
                }
                if (socket.request.headers.cookie) {
                    socket.request.headers.cookie = result.display_name
                }*/
                socket.emit ( 'updateName', {display_name: result.display_name, id: result.id})
            }
        })
        //socket.emit( 'success', {message: 'success message'})
    })

     socket.on( 'data', data => {
        console.log(data)
        //socket.emit( 'success', {message: 'success message'})
                socket.emit ( 'updateName', {display_name: 'thisisatest', id: '3'})
    })
  })
}

module.exports = { init }
