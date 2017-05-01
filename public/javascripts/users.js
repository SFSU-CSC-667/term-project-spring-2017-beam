const socket = io()

socket.on( 'user-created', ({ id, email, dogCount }) => {
  console.log( id, email )

  const tbody = document.querySelector( 'tbody' )
  const row = `
    <tr>
      <td>${id}</td>
      <td>${email}</td>
      <td>${dogCount || 0}</td>
    </tr>
  `

  tbody.innerHTML += row
})

document.querySelector( 'a.create-user' ).addEventListener( 'click', event => {
  event.preventDefault()
  event.stopPropagation()

  socket.emit( 'please-create-user', { email: 'me@me.com' })
})