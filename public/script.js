var chatSocket = io('/chat')

$(document).ready(function() {
  $('#modal').modal('show')
})

$('#chatNameForm').on('submit', function(e) {
  e.preventDefault()
  var name = $('#chatName').val()

  $('#name').val(name)
  getMessages()
})

function updateFeed (message, method) {
  var newMessage = '<div><strong>' + message.name + '</strong><p>' + message.message + '</p></div>'

  if (method === 'append') {
    $('.chat-feed').append(newMessage)
  } else if (method === 'prepend') {
    $('.chat-feed').prepend(newMessage)
  }
}

function getMessages() {
  $.ajax({
    type: 'GET',
    dataType: 'json',
    url: '/api/chat',
    success: function(response) {
      if (response.messages) {
        response.messages.reverse().map(function(message){
          updateFeed(message, 'prepend')
          $('#modal').modal('hide')
        })
      } else {
        $('#modal').modal('hide')
      }

      chatSocket.on('chat', function(message) {
        message = JSON.parse(message)
        updateFeed(message, 'append')
      })
    }
  })
}

$('#chatForm').on('submit', function(e) {
  e.preventDefault()
  var data = $('#chatForm').serialize()
  $.ajax({
    type: 'POST',
    url: '/api/chat',
    processData: false,
    data: data
  })
})