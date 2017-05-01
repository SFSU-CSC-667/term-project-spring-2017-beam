const express = require('express')
const faker = require( 'faker' )
const router = express.Router()

const { User } = require( '../db' )
const broadcast = require( '../src/broadcast' )

router.get( '/', ( request, response ) => {
  User.all()
    .then( users => {
      const user_info = {
      	id: 3,
      	registered: false,
      	display_name: 'Mike',
      }
      const room_1 = {
      	id: 1,
      	  room_name: 1,
      	  master_user_id: 2,
      	  master_user_display_name: 'Mike',
      	  max_players: 4
      }

	  const room_2 = {
	  	  id: 2,
	  	  room_name: 1,
	  	  master_user_id: 3,
	  	  master_user_display_name: 'Bob',
	  	  max_players: 5
	  	}
      const rooms_info = [room_1, room_2]

      response.render( 'index', { users , user_info, rooms_info})
    })
})

router.post( '/test', ( request, response ) => {
  User.create( faker.internet.email() )
    .then( user => broadcast( request.app.get( 'io' ), 'user-created', user ))
    .then( _ => response.send('done'))
})

module.exports = router
