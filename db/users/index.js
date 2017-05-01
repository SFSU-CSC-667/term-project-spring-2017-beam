const db = require( '../connection' )

const ALL = `SELECT * FROM users`
const FIND = `SELECT * FROM users WHERE id=$1`
const CREATE = `INSERT INTO users ( email ) VALUES ( $1 ) RETURNING *`

module.exports = {
  all: () => db.any( ALL ),
  find: id => db.oneOrNone( FIND, id ),
  create: email => db.one( CREATE, email )
}