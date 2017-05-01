const pgp = require( 'pg-promise' )()
const db = pgp( process.env.DATABASE_URL || 'postgres://jrob@localhost:5432/blargit-development' )

module.exports = db