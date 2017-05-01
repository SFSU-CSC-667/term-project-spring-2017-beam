const db = require( '../connection' )

const ALL = `SELECT * FROM users`
const FIND = `SELECT * FROM users WHERE id=$1`
const AUTH = `SELECT * FROM users WHERE id=$1 and secret=$2`
const CREATE = `INSERT into users (display_name, secret, registered) VALUES ('Guest', $1, false) RETURNING id, secret, display_name`
const ALL_ACTIVE = `SELECT rooms.*, users.display_name AS master_user_display_name FROM rooms,users
                    WHERE rooms.id > 0 AND rooms.ended IS NULL AND rooms.master_user_id = users.id`

module.exports = {
  all: () => db.any( ALL ),
  allActive: () => db.any( ALL_ACTIVE ),
  find: id => db.oneOrNone( FIND, id ),
  auth: id, secret => db.oneOrNone( AUTH, id, secret ),
  create: secret => db.one( CREATE, secret ),
}
