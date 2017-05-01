const pgp = require( 'pg-promise' )()
const db = pgp( process.env.DATABASE_URL || 'postgres://group667:jkjkjk@localhost:5432/group667' )

module.exports = db
