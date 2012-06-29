//
// UDP client for recieving notifications
//

var	dgram = require('dgram'),
    server = dgram.createSocket('udp4'),
    events = require('events'),
    config = require('./config');

// Exports
var client = module.exports = new events.EventEmitter();

// Events
server.on("message", function(msg, rinfo) {
	var data = JSON.parse(msg.toString());
  client.emit('notification', data);
});

server.on("listening", function () {
  var address = server.address();
  console.log("client listening:" +
      address.address + ":" + address.port);
});

server.bind(config.udp_port);

