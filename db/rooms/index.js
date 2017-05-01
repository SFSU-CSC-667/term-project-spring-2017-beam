const db = require( '../connection' )

const ALL_ACTIVE = `SELECT rooms.*, users.display_name AS master_user_display_name FROM rooms,users
                    WHERE rooms.id > 0 AND rooms.ended IS NULL AND rooms.master_user_id = users.id`


module.exports = {
  allActive: () => db.any( ALL_ACTIVE ),
}
