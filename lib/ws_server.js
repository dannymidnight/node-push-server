//
// Socket.io server for dishing out web sockets and shit.
//

module.exports = function(options) {

  var	winston	= require('winston'),
      util		= require('util'),
      rest		= require('restler'),
      io      = require('socket.io').listen(options.web_port),
      serverlog = winston.loggers.get('server'),
      channels = require('./channels');

    // Redis
    var config = require('../config'),
        redisPub = require('./redis').create(config.redis),
    redisSub = require('./redis').create(config.redis),

    redis = require('./redis').create(config.redis);



  channels.configure({
    publisher: redisPub,
    subscriber: redisSub,
    io: io
  });

  io.configure(function (){
    // Authorize via session ownership check
    io.set('authorization', function (handshakeData, callback) {
      if (handshakeData.query.userid && handshakeData.query.sessionid) {
        var userid = handshakeData.query.userid,
         sessionid = handshakeData.query.sessionid,
         host = options.session_host,
         sessionCheckUrl = 'http://' + host + '/users/sessioncheck/' + userid + "/" + sessionid;

				handshakeData.userid = userid;

				redis.hget('userSessionIds', userid, function(err, storedSessionId) {

				if (err) {
					serverlog.warn('[server] redis hget failed for userid %d', userid);
					return callback(null, false);
				}

				if (storedSessionId == sessionid) {
					return callback(null, true);
				}

        rest
          .get(sessionCheckUrl)
          .on('complete', function(data,response) {
	      if (data instanceof Error) {
		  serverlog.warn(util.format('Error for user #%d: %s', userid, data.message));
	      } else if (response && response.statusCode == 200 && data) {
							redis.hset('userSessionIds', userid, sessionid);
              callback(null, true);
            } else {
              if (response) {
                serverlog.info(util.format('[server] Response code: %s', response.statusCode));
              }
              callback(null, false);
            }

          });
				});
      } else {
        callback(null, false);
      }
    });
  });

  io.sockets.on('connection', function(socket) {
      var userid = socket.handshake.userid;

    if (!userid) {
      socket.disconnect();
    }

    channels.add(userid, socket);

    serverlog.info(util.format('[server] User #%d connected via %s', userid, io.transports[socket.id].name));
    serverlog.info(util.format('[server] Total clients from socketio %d', io.sockets.clients().length));

      redis.hkeys('userSessionIds', function(err, keys) {
	  serverlog.info(util.format('[server] Total users %d', keys.length));
      });

    socket.on('seen', function(data) {
      io.push('seen', userid, data);
    });

    socket.on('disconnect', function() {
			console.log(util.format('disconnect for %d', userid));
      channels.remove(userid, socket);
    });
  });

  // Push to a user
  io.push = function(event, userid, data) {
    serverlog.info(util.format('[server] Emitted %s to user: #%d', event, userid));
    channels.emit(userid, event, data);
  };

  return io;
};
