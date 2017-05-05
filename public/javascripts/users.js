const socket = io();console.log('test')

const activateButtons = function(){
  console.log("activate")
  if (document.querySelector( 'button.start_game_button' )){
    document.querySelector( 'button.start_game_button' ).addEventListener( 'click', event => {
      event.preventDefault()
      event.stopPropagation()
      socket.emit( 'start-game', {room_id: room.room_id})
    })
  }
  if (document.querySelector( 'button.leave_game_button' )){
    document.querySelector( 'button.leave_game_button' ).addEventListener( 'click', event => {
      event.preventDefault()
      event.stopPropagation()
      socket.emit( 'leave-game', {room_id: room.room_id})
    })
  }
  if (document.querySelector( 'button.enter_game_button' )){
    document.querySelector( 'button.enter_game_button' ).addEventListener( 'click', event => {
      event.preventDefault()
      console.log("enter")
      event.stopPropagation()
      socket.emit( 'enter-game', {room_id: room.room_id})
    })
  }
  if (document.querySelector( 'button.liar_game_button' )){
    document.querySelector( 'button.liar_game_button' ).addEventListener( 'click', event => {
      event.preventDefault()
      event.stopPropagation()
      socket.emit( 'liar', {room_id: room.room_id})
    })
  }
  //here
  if (document.querySelector( 'form.roll_form'))  document.querySelector( 'form.roll_form' ).addEventListener( 'submit', event => {
    event.preventDefault()
    event.stopPropagation()
    const roll_die = document.querySelector('input[name=die]:checked').value
    const roll_amount = document.querySelector('input.roll_amount').value
    console.log(roll_die)
    console.log(roll_amount)
  })
}
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
    console.log(data)
    console.log('lol')
    const title_bar = document.querySelector ('h1.room_title')
    title_bar.innerHTML = data[0].name
    if (data[0].started == null) {
        if (data[0].master_user_id == user.user_id && data[0].user_id_order.length > 1) {
           title_bar.innerHTML += " <button class='start_game_button btn'>start game</button>"
        }
        if (data[0].user_id_order.indexOf(parseInt(user.user_id)) > -1) {
            title_bar.innerHTML += " <button class='leave_game_button btn'>leave game</button>"
        } else {
            title_bar.innerHTML += " <button class='enter_game_button btn'>enter game</button>"
        }
    } else if (data[0].user_id_order.length > 1) {
        if (last_move.roll > 0 && last_move.roll < 7 && data[0].user_id_order[0] == user.user_id) {
            title_bar.innerHTML += " <button class='liar_game_button btn'>Liar!</button>"
        }

    }


    const status = document.querySelector( 'tbody.room_info')
    status.innerHTML = ''
    for(row in data) {
      document.querySelector('h1.room_title').value = data[row].room_id
      if(data[row].started != null)
        document.querySelector('th.check_header').value = 'Current Turn'
      var rowHTML = 
      `
      <tr>
        <td>`
          if (data[row].user_id == data[row].master_user_id && data[row].started == null) rowHTML += `X`
          else if (data[row].user_id == data[row].user_id_order[0] && data[row].started != null) rowHTML += `X`
          rowHTML+=`
        </td>
        <td>
          `+data[row].display_name+ `#` + data[row].user_id+`
        </td>
        <td>`
          if (data[row].user_id == user.user_id)
            for (dice in user.dices)
            rowHTML+= user.dices[dice] + ` `
          else
            for (var i = 0; i< data[row].dice_amount; i++)
            rowHTML+=`? `
          rowHTML+=`
        </td>
      <tr>
      `
      status.innerHTML += rowHTML
    }
    activateButtons();
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

socket.on ( 'last-move', recentMove => {
    last_move = recentMove
})

socket.on ( 'user-roll', ({room_id, roll}) => {
    if (room.room_id == room_id) 
        user.dices = roll
})

socket.on ( 'chat', ({user_id, display_name, message}) => {
    const print = '<strong>' + display_name + '#' + user_id+ '</strong>: ' + message
    const chat_area = document.querySelector ( 'ul.chat_area' )
    const append = `<td>${print}<br></td>`
    chat_area.innerHTML += append
    chat_area.scrollTop = chat_area.scrollHeight
})

socket.on ( 'update-name', ({display_name, id}) => {
    document.querySelector( 'p.name' ).innerHTML = 'Welcome, ' + display_name + '#' + id
    $('.myModal1').modal('hide')
    document.querySelector('input.update_name_input').placeholder = display_name
    document.querySelector('input.update_name_input').value = ''
})

socket.on ( 'error-message', ({message}) => {
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
  socket.emit( 'room-subscribe', room.room_id)
})


document.addEventListener('DOMContentLoaded', function() {


  document.querySelector( 'a.data' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    socket.emit( 'start-game', {room_id: room.room_id})
    //socket.emit( 'data', {username: input})
  })

  document.querySelector( 'button.chat_input_button' ).addEventListener( 'click', event => {
    event.preventDefault()
    event.stopPropagation()
    const input = document.querySelector('input.chat_input_text').value
    document.querySelector('input.chat_input_text').value=''
    socket.emit( 'chat', {room_id: room.room_id, message: input})

  })

  if (document.querySelector( 'form.room_name_form'))  document.querySelector( 'form.room_name_form' ).addEventListener( 'submit', event => {
    event.preventDefault()
    event.stopPropagation()
    const room_name = document.querySelector('input.room_name_input').value
    socket.emit( 'create-room', {room_name: room_name})
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
    socket.emit( 'display-name-update', {display_name: display_name})
  })
  
  activateButtons();
})


function customRadio(radioName){
  var radioButton = $('input[name="'+ radioName +'"]');
  $(radioButton).each(function(){
    if($(this).is(':checked')){
      $(this).parent().addClass("selected");
    }
  });
  $(radioButton).click(function(){
    if($(this).is(':checked')){
      $(this).parent().addClass("selected");
    }
    $(radioButton).not(this).each(function(){
      $(this).parent().removeClass("selected");
    });
  });
}
$(document).ready(function (){
    customRadio("die");
})
