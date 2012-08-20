//
// Socket.io server for dishing out web sockets and shit.
//

var	sha1   	= require('sha1'),
    winston	= require('winston'),
    util		= require('util'),
    config 	= require('./config'),
		http		= require('http'),
    io     	= require('socket.io').listen(config.web_port);

var serverlog = winston.loggers.get('server');

module.exports = io;

io.sockets.on('connection', function(socket) {
	var user;

	socket.on('user', function(data) {

		serverlog.info(data.sessionid);

		var options = {
			host: config.contests_http_host,
			port: 80,
			path: '/users/sessioncheck/' + data.userid + "/" + data.sessionid
		};

		var req = http.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (http_response) {
				serverlog.info("http_response = " + http_response);
				if (http_response) {
					// Register socket for user.
					user = { id: data.userid };
					socket.join(user.id);

					serverlog.info(util.format('[server] User #%d connected via %s', data.userid, io.transports[socket.id].name));
				}
			});
		});

		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});

		req.end();
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
