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

socket.on('room-update', data => {
    const rooms_position = document.querySelector( 'tbody.rooms_list')
    rooms_position.innerHTML = ''
    for(row in data) {
      var rowHTML = 
      `
      <tr>
        <td>
          <a href="/room/`+data[row].id+ `">`+data[row].name+`</a>
        </td>
        <td>
          `+data[row].master_user_display_name+ `#` + data[row].master_user_id+`
        </td>
        <td>`
          if (data[row].started) rowHTML += `In Progress`
          else rowHTML += `Waiting`
          rowHTML+=`
        </td>
      <tr>
      `
      rooms_position.innerHTML += rowHTML
    }
})

socket.on('lobby-update', data => {
    const rooms_position = document.querySelector( 'tbody.rooms_list')
    rooms_position.innerHTML = ''
    for(row in data) {
      var rowHTML = 
      `
      <tr>
        <td>
          <a href="/room/`+data[row].id+ `">`+data[row].name + `#` + data[row].id+`</a>
        </td>
        <td>
          `+data[row].master_user_display_name+ `#` + data[row].master_user_id+`
        </td>
        <td>`
          if (data[row].started) rowHTML += `In Progress`
          else rowHTML += `Waiting`
          rowHTML+=`
        </td>
      <tr>
      `
      rooms_position.innerHTML += rowHTML
    }
})

socket.on ( 'chat', ({user_id, display_name, message}) => {
    const print = '<strong>' + display_name + '#' + user_id+ '</strong>: ' + message
    const chat_area = document.querySelector ( 'ul.chat_area' )
    const append = `<td>${print}<br></td>`
    chat_area.innerHTML += append
    chat_area.scrollTop = chat_area.scrollHeight
})

socket.on ( 'updateName', ({display_name, id}) => {
    document.querySelector( 'p.name' ).innerHTML = 'Welcome, ' + display_name + '#' + id
    $('.myModal1').modal('hide')
    document.querySelector('input.update_name_input').placeholder = display_name
    document.querySelector('input.update_name_input').value = ''
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

socket.on ('connect', () => {
  socket.emit( 'room_subscribe', room.room_id)
})


document.addEventListener('DOMContentLoaded', function() {


  document.querySelector( 'a.data' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = 'lolmepops'
    socket.emit( 'data', room.room_id)
    //socket.emit( 'data', {username: input})
  })

  document.querySelector( 'button.chat_input_button' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = document.querySelector('input.chat_input_text').value
    document.querySelector('input.chat_input_text').value=''
    socket.emit( 'chat', {room_id: room.room_id, message: input})

  })

  document.querySelector( 'form.room_name_form' ).addEventListener( 'submit', event => {
    event.preventDefault()
    event.stopPropagation()
    const room_name = document.querySelector('input.room_name_input').value
    socket.emit( 'create_room', {room_name: room_name})
  })

  document.querySelector( 'form.login_form' ).addEventListener( 'submit', event => {
    event.preventDefault()
    event.stopPropagation()
    const username = document.querySelector('input.username_login_input').value
    const password = document.querySelector('input.password_login_input').value
    socket.emit( 'login', {username: username, password: password})
  })


  document.querySelector( 'form.signup_form' ).addEventListener( 'submit', event => {
    event.preventDefault()
    event.stopPropagation()
    const username = document.querySelector('input.username_signup_input').value
    const password = document.querySelector('input.password_signup_input').value
    socket.emit( 'signup', {username: username, password: password})
  })

  document.querySelector( 'form.update_name_form' ).addEventListener( 'submit', event => {
    event.preventDefault()
    event.stopPropagation()
    const display_name = document.querySelector('input.update_name_input').value
    socket.emit( 'display_name_update', {display_name: display_name})
  })

})
