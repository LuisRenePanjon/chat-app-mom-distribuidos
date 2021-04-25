var join = require('path').join
var rfs = require('fs').readFileSync
var amqp = require('amqplib/callback_api')

var opts = {
  
}

amqp.connect('amqps://admin:BJHODDPISRWDLRHF@portal2071-16.groovy-rabbitmq-24.2143387031.composedb.com:16960/groovy-rabbitmq-24',
  opts, function(err, conn) {
    if (err) {
      throw new Error(err)
    }

    console.log(conn)
    conn.close()
})

module.exports = function(cb) {
  amqp.connect('amqps://admin:BJHODDPISRWDLRHF@portal2071-16.groovy-rabbitmq-24.2143387031.composedb.com:16960/groovy-rabbitmq-24',
  opts, function(err, conn) {
    if (err) {
      throw new Error(err)
    }

    cb(conn)
  })
}