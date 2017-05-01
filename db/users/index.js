const db = require( '../connection' )

const ALL = `SELECT * FROM users`
const FIND = `SELECT * FROM users WHERE id=$1`
const CREATE = `INSERT INTO users ( email ) VALUES ( $1 ) RETURNING *`
const ALL_ACTIVE = `SELECT rooms.*, users.display_name AS master_user_display_name FROM rooms,users
                    WHERE rooms.id > 0 AND rooms.ended IS NULL AND rooms.master_user_id = users.id`

module.exports = {
  all: () => db.any( ALL ),
  allActive: () => db.any( ALL_ACTIVE ),
  find: id => db.oneOrNone( FIND, id ),
  create: email => db.one( CREATE, email )
}
