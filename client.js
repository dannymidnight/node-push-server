//
// UDP client for recieving notifications
//

var	dgram = require('dgram'),
    winston	= require('winston'),
    util		= require('util'),
    server = dgram.createSocket('udp4'),
    events = require('events'),
    config = require('./config');

var clientlog = winston.loggers.get('client');

// Exports
var client = module.exports = new events.EventEmitter();

// Events
server.on("message", function(msg, rinfo) {
  var data = JSON.parse(msg.toString());
  clientlog.info(util.format("[client] Received notification #%d for user #%d", data['data']['notification']['id'], data.userid));
  client.emit('notification', data);
});

server.on("listening", function () {
  var address = server.address();
  clientlog.info(util.format("[client] listening: %s:%d", address.address, address.port));
});

server.bind(config.udp_port);

