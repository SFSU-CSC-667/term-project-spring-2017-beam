const express = require('express')
const faker = require( 'faker' )
const router = express.Router()

const { User } = require( '../db' )
const broadcast = require( '../src/broadcast' )

router.get( '/', ( request, response ) => {
  User.all()
    .then( users => {
      response.render( 'index', { users , user_info.id: 3, user_info.registered: false, user_info.display_name: 'Mike'})
    })
})

router.post( '/test', ( request, response ) => {
  User.create( faker.internet.email() )
    .then( user => broadcast( request.app.get( 'io' ), 'user-created', user ))
    .then( _ => response.send('done'))
})

module.exports = router
