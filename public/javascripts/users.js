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

socket.on ( 'lobby-chat', ({user_id, display_name, message}) => {
    const print = display_name + '#' + user_id+ ': ' + message
    console.log(print)
    const chat_area = document.querySelector ( 'ul.chat_area' )
    const append = `<td>${print}</td>`
    chat_area.innerHTML += append
})

socket.on ( 'sucess', ({message}) => {
    console.log(message)
    $.flash(message)
    $(".alert-success").text(message).show().fadeTo(5000,0)

})

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector( 'a.data' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = 'lolmepops'

    socket.emit( 'data', {email: input})
  })

  document.querySelector( 'button.chat_input_button' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = document.querySelector('input.chat_input_text').value
    socket.emit( 'lobby-chat', {message: input})

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
