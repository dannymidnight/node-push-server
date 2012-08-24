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

io.configure(function (){
	io.set('authorization', function (handshakeData, callback) {
		if (handshakeData.query.userid && handshakeData.query.sessionid) {
			var userid = handshakeData.query.userid;
			var sessionid = handshakeData.query.sessionid;
			var sessioncheck_url = 'http://' + config.contests_http_host + '/users/sessioncheck/' + userid + "/" + sessionid;
			rest
				.get(sessioncheck_url)
				.on('complete', function(data,response) {
					if (response.statusCode == 200 && data) {
						handshakeData.userid = userid;
						callback(null, true);
					} else {
						callback(null, false);
					}
				});
		} else {
			callback(null, false);
		}
	});
});

io.sockets.on('connection', function(socket) {
	var userid = socket.handshake.userid,
     totalRooms = 0;

  if (!userid) {
    socket.disconnect();
  }

	socket.join(userid);
	totalRooms = Object.keys(io.sockets.manager.rooms).length - 1;

	serverlog.info(util.format('[server] %s rooms open', totalRooms));
	serverlog.info(util.format('[server] User #%d connected via %s', userid, io.transports[socket.id].name));

	socket.on('seen', function(data) {
    io.push('seen', userid, data);
	});

	socket.on('disconnect', function(data) {
		socket.leave(userid);
	});
});

// Push to a user
io.push = function(event, userid, data) {
  if (Object.keys(io.sockets.clients(userid)).length) {
    serverlog.info(util.format('[server] Emitted %s to user: #%d', event, userid));
    io.sockets.in(userid).emit(event, data);
  }
};
