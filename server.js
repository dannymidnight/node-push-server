//
// Socket.io server for dishing out web sockets and shit.
//

var	sha1   	= require('sha1'),
    winston	= require('winston'),
    util		= require('util'),
    config 	= require('./config'),
		rest		= require('restler'),
    io     	= require('socket.io').listen(config.web_port);

var serverlog = winston.loggers.get('server');

module.exports = io;

io.sockets.on('connection', function(socket) {
	var user;

	socket.on('user', function(data) {

		var sessioncheck_url = 'http://' + config.contests_http_host + '/users/sessioncheck/' + data.userid + "/" + data.sessionid;
		rest.get(sessioncheck_url).on('success', function(http_response) {
			if (http_response) {
				// Register socket for user.
				user = { id: data.userid };
				socket.join(user.id);

				serverlog.info(util.format('[server] User #%d connected via %s', data.userid, io.transports[socket.id].name));
			}
		});

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
