var express = require('express')
var bodyParser = require('body-parser')
var rabbitConn = require('./connection')
var app = express()
var router = express.Router()
var server = require('http').Server(app)
var io = require('socket.io')(server)


var chat = io.of('/chat')


rabbitConn(function(conn) {
  conn.createChannel(function(err, ch) {
    if (err) {
      throw new Error(err)
    }
    var ex = 'chat_ex'
    //abrimos la conexion
    ch.assertExchange(ex, 'fanout', {durable: false})
    //enalazamos la cola
    ch.assertQueue('', {exclusive: true}, function(err, q) {
      if (err) {
        throw new Error(err)
      }
      ch.bindQueue(q.queue, ex, '')
      ch.consume(q.que, function(msg) {
        chat.emit('chat', msg.content.toString())
      })
    }, {noAck: true})
  })
})


app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api', router)
router.route('/chat')

// Cuando se publica un nuevo mensaje de chat, 
// abrimos un canal de comunicación a RabbitMQ 
  .post(function(req, res) {
    rabbitConn(function(conn) {
      // Luego pasamos el canal 
      conn.createChannel(function(err, ch) {
        if (err) {
          throw new Error(err)
        }
        var ex = 'chat_ex'
        var q = 'chat_q'
        var msg = JSON.stringify(req.body)
        //  Con 'fanout', cada consumidor que esté suscrito al "Excahge" recibirá los mensajes.
        ch.assertExchange(ex, 'fanout', {durable: false})
        ch.publish(ex, '', new Buffer(msg), {persistent: false})
        //  Crear una cola llamada 'chat' a no ser que ya exista.
        ch.assertQueue(q, {durable: true})
        // publica el mensaje en la cola de 'chat'.
        ch.sendToQueue(q, new Buffer(msg), {persistent: true})
        ch.close(function() {conn.close()})
      })
    })
  })

  .get(function(req, res){
    rabbitConn(function(conn){
      conn.createChannel(function(err, ch) {
        if (err) {
          throw new Error(err)
        }

        var q = 'chat_q'

        ch.assertQueue(q, {durable: true}, function(err, status) {
          if (err) {
            throw new Error(err)
          }
          else if (status.messageCount === 0) {
            res.send('{"messages": 0}')
          } else {
            var numChunks = 0;

            res.writeHead(200, {"Content-Type": "application/json"})
            res.write('{"messages": [')

            ch.consume(q.que, function(msg) {
              var resChunk = msg.content.toString()

              res.write(resChunk)
              numChunks += 1
              numChunks < status.messageCount && res.write(',')

              if (numChunks === status.messageCount) {
                res.write(']}')
                res.end()
                ch.close(function() {conn.close()})
              }
            })
          }
        })
      }, {noAck: true})
    })
  })

server.listen(3030, '0.0.0.0',
  function() {
    console.log('Chat at localhost:3030')
  }
)