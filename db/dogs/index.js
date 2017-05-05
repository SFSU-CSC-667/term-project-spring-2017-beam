const db = require( '../connection' )

const FIND_BY_OWNER = `
  SELECT * FROM dogs WHERE user_id=$1
`

module.exports = {
  findByOwner: owner_id => db.any( FIND_BY_OWNER, owner_id )
  // findByOwner: owner_id => {
  //   return db.any( FIND_BY_OWNER, owner_id )
  // }
}