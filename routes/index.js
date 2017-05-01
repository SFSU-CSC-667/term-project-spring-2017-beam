const express = require('express')
const faker = require( 'faker' )
const router = express.Router()

const { User, Room } = require( '../db' )
const broadcast = require( '../src/broadcast' )



function createTempUserIfNeeded(req, res, next) {
    if (debug) console.log('createTempUserIfNeeded function called');
    if (!req.cookies.user_id && !req.cookies.user_secret) {
        var secret = randomstring.generate(60);
        User.create(secret)
        .then (result => ) {
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

router.get( '/', ( request, response ) => {


  const userPromise = User.all()
  const roomsPromise = Room.allActive()

  Promise.all([userPromise,roomsPromise])
    .then( values  => {
      const user_info = {
      	id: 3,
      	registered: false,
      	display_name: 'Mike',
      }
     response.render( 'index', { users: values[0] , user_info, rooms_info: values[1]})
    })
})

router.get( '/rooms', ( request, response ) => {


  const promise = User.allActive()
  Promise.all([promise]).then( values => {
    const user_info = {
      id: 3,
      registered: false,
      display_name: 'Mike',
    }
   response.render( 'index2', { users: values[0] , user_info})
  })

})



router.post( '/test', ( request, response ) => {
  User.create( faker.internet.email() )
    .then( user => broadcast( request.app.get( 'io' ), 'user-created', user ))
    .then( _ => response.send('done'))
})

module.exports = router
