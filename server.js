//
// Socket.io server for dishing out web sockets and shit.
//

var	sha1   = require('sha1'),
    config = require('./config'),
    io     = require('socket.io').listen(config.web_port);

module.exports = io;
 
io.sockets.on('connection', function(socket) {
	var user;

	socket.on('user', function(data) {
		var hash = sha1(data.id + config.secretkey);

		if (data.hash === hash) {
			// Register socket for user.
			user = { id: data.id };
      socket.join(user.id);

			console.log('User #%d connected', data.id);
		}
	});

	socket.on('seen', function(data) {
		if (user)
      io.push('seen', user.id, data);
	});

	socket.on('disconnect', function(data) {
		if (user)
			socket.leave(user.id);
	});
});

// Push to a user
io.push = function(event, userid, data) {
  io.sockets.in(userid).emit(event, data);
};
