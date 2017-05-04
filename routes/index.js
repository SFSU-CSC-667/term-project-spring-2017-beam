const express = require('express')
const faker = require( 'faker' )
const router = express.Router()
const debug = true;
const bcrypt = require('bcrypt')

const { User, Room } = require( '../db' )
const broadcast = require( '../src/broadcast' )

const randomstring = require ('randomstring');


function createTempUserIfNeeded(req, res, next) {
    if (debug) console.log('createTempUserIfNeeded function called');
    if (!req.cookies.user_id && !req.cookies.user_secret) {
        var secret = randomstring.generate(60);
        User.create(secret)
        .then (result =>  {
            req.cookies.user_id = result.id;
            req.cookies.user_secret = result.secret;
            req.cookies.display_name = result.display_name;
            res.cookie('display_name', result.display_name);
            res.cookie('user_secret', result.secret);
            res.cookie('user_id', result.id);
            next();
        });
    } else {
        next();
    }
}

function checkAuth(req, res, next) {
    //authentication stuff
    if (debug) console.log('checkAuth function called');
    const data = {user_id: req.cookies.user_id, user_secret: req.cookies.user_secret};
    User.auth(req.cookies.user_id, req.cookies.user_secret)
    .then ( result => {
        if (!result) {
            res.clearCookie('user_secret');
            res.clearCookie('user_id');
            res.clearCookie('display_name');
            return res.status(403).json();
        } else {
            res.cookie('display_name', result.display_name);
            next();
        }});
}



function loginFunction (req, res) {
    User.findByUsername(req.params.username)
    .then( result => {
        if (!result) {
            res.render ('logout', {message: 'Bad Login'})
        } else {
            bcrypt.compare(req.params.password, result.password)
            .then (check => {
               if (!check) {
                  res.render ('logout', {message: 'Bad Login'})
               } else {
                  req.cookies.display_name = result.display_name
                  req.cookies.user_secret = result.secret
                  req.cookies.user_id = result.id
                  res.cookie('display_name', result.display_name);
                  res.cookie('user_secret', result.secret);
                  res.cookie('user_id', result.id);
                  res.redirect('/')
                  return;
               }
            })

        }
    })

    

}

function indexFunction (request, response ) {


  const roomsPromise = Room.allActive()
  const userInfo = User.findById(request.cookies.user_id)

  Promise.all([roomsPromise, userInfo])
    .then( values  => {
       response.render( 'index', {user_info: values[1], rooms_info: values[0]})
    })
}

function roomFunction (request, response ) {


  const userInfo = User.findById(request.cookies.user_id)

  Promise.all([userInfo])
    .then( values  => {
       console.log(request.params.room_id)
       response.render( 'room', { user_info: values[0], room_id: request.params.room_id})
    })
}

function index2Function (request, response ) {


  const userPromise = User.all()
  const roomsPromise = Room.allActive()
  const userInfo = User.findById(request.cookies.user_id)

  Promise.all([userPromise,roomsPromise, userInfo])
    .then( values  => {
       response.render( 'index2', { users: values[0] , user_info: values[2], rooms_info: values[1]})
    })
}

function logoutFunction (req, res) {
     res.clearCookie('user_secret');
     res.clearCookie('user_id');
     res.clearCookie('display_name');
     res.redirect('/')
}
router.use(createTempUserIfNeeded);
router.use(checkAuth);
router.get( '/login/:username/:password', loginFunction)
router.get( '/logout', logoutFunction)
router.get( '/', indexFunction)
router.get( '/room/:room_id', roomFunction)
router.get( '/2', index2Function)

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
  User.create( faker.internet.username() )
    .then( user => broadcast( request.app.get( 'io' ), 'user-created', user ))
    .then( _ => response.send('done'))
})

module.exports = router
