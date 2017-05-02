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

socket.on( 'redirect', ({destination}) => {
  window.location.href = destination
})

socket.on ( 'sucess', ({message}) => {
    console.log(message)
})

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector( 'a.data' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = document.querySelector('input.chat_input').value

    socket.emit( 'data', {email: input})
  })

  document.querySelector( 'button.chat_input_button' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    console.log('test');
  })

  document.querySelector( 'a.signup' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const email = document.querySelector('input.email_input').value
    const password = document.querySelector('input.password_input').value
    socket.emit( 'signup', {email: email, password: password})
  })

  document.querySelector( 'a.login' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const email = document.querySelector('input.email_input').value
    const password = document.querySelector('input.password_input').value
    window.location.href = 'login/' + email + '/' + password
  })

})
