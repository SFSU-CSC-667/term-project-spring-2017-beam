const db = require( '../connection' )

const ALL = `SELECT id, display_name FROM users`
const FIND_BY_ID = `SELECT id, display_name, registered FROM users WHERE id=$1`
const AUTH = `SELECT id, display_name FROM users WHERE id=$1 AND secret=$2`
const CREATE = `INSERT INTO users (display_name, secret, registered) VALUES ('Guest', $1, false) RETURNING id, secret, display_name`
const CHECK_IF_REGISTERED = `SELECT id, display_name FROM users WHERE (id=$1 AND registered=true) OR email=$2`
const REGISTER = `UPDATE users SET password=$1, email=$2, registered=true WHERE id=$3`
const FIND_BY_EMAIL = `SELECT id, display_name, password FROM users WHERE email=$1`
const UPDATE_DISPLAY_NAME = `UPDATE users SET display_name=$1 WHERE id=$2 RETURNING id, display_name`

module.exports = {
  all: () => db.any( ALL ),
  findById: id => db.oneOrNone( FIND_BY_ID, id ),
  auth: (id, secret) => db.oneOrNone( AUTH, [id, secret] ),
  create: secret => db.one( CREATE, secret ),
  checkIfRegistered: (id, email) => db.any( CHECK_IF_REGISTERED, [id, email] ),
  register: (password, email, id) => db.none( REGISTER, [password, email, id] ),
  findByEmail: email => db.oneOrNone( FIND_BY_EMAIL, email ),
  updateDisplayName: (display_name, id) => db.oneOrNone( FIND_BY_EMAIL, [display_name, id] ),
}
