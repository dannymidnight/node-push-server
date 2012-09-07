//
// UDP client for receiving notifications
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
	try {
		var data = JSON.parse(msg.toString());
	} catch(e) {
		clientlog.error('[client] Dropped malformed message string (' + e.message + ') : ' + msg);
		return;
	}
  clientlog.info(util.format("[client] Received %s notification #%d for user #%d", data['data']['notification']['type'], data['data']['notification']['id'], data.userid));
  client.emit('notification', data);
});

server.on("listening", function () {
  var address = server.address();
  clientlog.info(util.format("[client] listening: %s:%d", address.address, address.port));
});

server.bind(config.udp_port);

