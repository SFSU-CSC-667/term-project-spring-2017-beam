const socket = io()

socket.on( 'user-created', ({ id, username, dogCount }) => {
  console.log( id, username )

  const tbody = document.querySelector( 'tbody' )
  const row = `
    <tr>
      <td>${id}</td>
      <td>${username}</td>
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
    const append = `<td>${print}<br></td>`
    chat_area.innerHTML += append
})

socket.on ( 'errorMessage', ({message}) => {
    $(".alert-danger").text(message).show()
    setTimeout(function() {
        $(".alert-danger").text(message).hide()
    }, 5000);

})

socket.on ( 'success', ({message}) => {
    $(".alert-success").text(message).show()
    setTimeout(function() {
        $(".alert-success").text(message).hide()
    }, 5000);

})

function doLogin (event) {
    const username = document.querySelector('input.username_input').value
    const password = document.querySelector('input.password_input').value
    socket.emit( 'login', {username: username, password: password})
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelector( 'a.data' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = 'lolmepops'

    socket.emit( 'data', {username: input})
  })

  document.querySelector( 'button.chat_input_button' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = document.querySelector('input.chat_input_text').value
    document.querySelector('input.chat_input_text').value=''
    socket.emit( 'lobby-chat', {message: input})

  })

  document.querySelector( 'a.signup' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const username = document.querySelector('input.username_input').value
    const password = document.querySelector('input.password_input').value
    socket.emit( 'signup', {username: username, password: password})
  })

  document.querySelector( 'a.login' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    doLogin()
  })

  document.querySelector( 'button.login_button' ).addEventListener( 'click', event => {
   event.preventDefault()
    event.stopPropagation()
    doLogin()
  })

  $("input.password_input").on('keyup', function (e) {
     if (e.keyCode == 13) {
         doLogin()
     }
  });

$("input.username_input").on('keyup', function (e) {
     if (e.keyCode == 13) {
         doLogin()
     }
  });

})
