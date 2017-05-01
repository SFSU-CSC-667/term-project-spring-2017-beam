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

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector( 'a.data' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = document.querySelector('input.chat_input').value

    socket.emit( 'data', {email: input})
  })

  document.querySelector( 'a.signup' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()


    const email = document.querySelector('email_input').value
    const password = document.querySelector('password_input').value
    socket.emit( 'signup', {email: email, password: password})
  })
})
