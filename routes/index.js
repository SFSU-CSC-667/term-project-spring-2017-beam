const express = require('express')
const faker = require( 'faker' )
const router = express.Router()

const { User } = require( '../db' )
const broadcast = require( '../src/broadcast' )

router.get( '/', ( request, response ) => {


  const userPromise = User.all()
  const roomsPromise = Room.allAcitve()

  Promise.all([userPromise,roomsPromise])
    .then( (users, rooms_info => {
      const user_info = {
      	id: 3,
      	registered: false,
      	display_name: 'Mike',
      }
      response.render( 'index', { users , user_info, rooms_info})
    })
})

router.post( '/test', ( request, response ) => {
  User.create( faker.internet.email() )
    .then( user => broadcast( request.app.get( 'io' ), 'user-created', user ))
    .then( _ => response.send('done'))
})

module.exports = router
