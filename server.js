//
// Socket.io server for dishing out web sockets and shit.
//

var	sha1   	= require('sha1'),
    winston	= require('winston'),
    util		= require('util'),
    config 	= require('./config'),
    io     	= require('socket.io').listen(config.web_port);

var serverlog = winston.loggers.get('server');

module.exports = io;

io.sockets.on('connection', function(socket) {
	var user;

	socket.on('user', function(data) {
		var hash = sha1(data.id + config.secretkey);

		if (data.hash === hash) {
			// Register socket for user.
			user = { id: data.id };
      socket.join(user.id);

      serverlog.info(util.format('[server] User #%d connected', data.id));
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
  serverlog.info(util.format('[server] Sent notification to user #%d', userid));
  io.sockets.in(userid).emit(event, data);
};
