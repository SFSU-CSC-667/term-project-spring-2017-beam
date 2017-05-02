const db = require( '../connection' )

const ALL = `SELECT id, display_name FROM users`
const FIND_BY_ID = `SELECT id, display_name, registered FROM users WHERE id=$1`
const AUTH = `SELECT id, display_name FROM users WHERE id=$1 AND secret=$2`
const CREATE = `INSERT INTO users (display_name, secret, registered) VALUES ('Guest', $1, false) RETURNING id, secret, display_name`
const CHECK_IF_REGISTERED = `SELECT id, display_name FROM users WHERE (id=$1 AND registered=true) OR username=$2`
const REGISTER = `UPDATE users SET password=$1, username=$2, registered=true WHERE id=$3`
const FIND_BY_USERNAME= `SELECT id, display_name, password, secret FROM users WHERE username=$1`
const UPDATE_DISPLAY_NAME = `UPDATE users SET display_name=$1 WHERE id=$2 RETURNING id, display_name`

module.exports = {
  all: () => db.any( ALL ),
  findById: id => db.oneOrNone( FIND_BY_ID, id ),
  auth: (id, secret) => db.oneOrNone( AUTH, [id, secret] ),
  create: secret => db.one( CREATE, secret ),
  checkIfRegistered: (id, username) => db.any( CHECK_IF_REGISTERED, [id, username] ),
  register: (password, username, id) => db.none( REGISTER, [password, username, id] ),
  findByUsername: username => db.oneOrNone( FIND_BY_USERNAME, username ),
  updateDisplayName: (display_name, id) => db.oneOrNone( UPDATE_DISPLAY_NAME, [display_name, id] ),
}
