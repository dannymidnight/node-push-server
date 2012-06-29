
var config = require('./config'),
	io = require('socket.io').listen(config.web_port),
	dgram = require('dgram'),
	sha1 = require('sha1');

// Start listening for events.
var server = dgram.createSocket('udp6', function(msg, rinfo) {
	var data = JSON.parse(msg.toString());

	// send notification.
	pocket.emit('notification', data.userid, data.data);
});
server.bind(config.udp_port);


var pocket = {
	addSocket: function(user, socket) {
		socket.join(user.id);
	},

	dropSocket: function(user, socket) {
		socket.leave(user.id);
	},

	emit: function(event, userid, data) {
		io.sockets.in(userid).emit(event, data);
	}
};


io.sockets.on('connection', function(socket) {
	var user;

	socket.on('user', function(data) {
		var hash = sha1(data.id + config.secretkey);

		if (data.hash === hash) {
			// Register socket for user.
			user = { id: data.id };
			pocket.addSocket(user, socket);

			console.log('User #%d connected', data.id);
		}
	});

	socket.on('seen', function(data) {
		if (user)
			pocket.emit('seen', user.id, data);
	});

	socket.on('disconnect', function(data) {
		if (user)
			pocket.dropSocket(user, socket);
	});
});
