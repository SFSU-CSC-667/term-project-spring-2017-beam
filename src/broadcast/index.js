const broadcast = ( io, channel, message ) => {
  console.log( 'broadcast', channel, message )

  io.emit( channel, message )
}

module.exports = broadcast