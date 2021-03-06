//
// Socket.io server for dishing out web sockets and shit.
//

module.exports = function(options) {

  var	winston	= require('winston'),
      util		= require('util'),
      rest		= require('restler'),
      io      = require('socket.io').listen(options.web_port),
      serverlog = winston.loggers.get('server');
      channels = options.channels;

    // Redis
    var config = require('../config'),
        redis = require('./redis').create(config.redis);

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

    serverlog.info(util.format('[server] User #%d connected via %s', userid, io.transports[socket.id].name));
    serverlog.info(util.format('[server] Total clients from socketio %d', io.sockets.clients().length));

    redis.hkeys('userSessionIds', function(err, keys) {
      serverlog.info(util.format('[server] Total users %d', keys.length));
    });

    socket.on('seen', function(data) {
      channels.emit(userid, 'seen', data);
    });

    var notification = function(e) {
      serverlog.info(util.format('[server] Emitted %s to user: #%d', e.event, userid));
      // socket.emit(e.event, e.data);
    };

    var seen = function(e) {
      serverlog.info(util.format('[server] Emitted %s to user: #%d', e.event, userid));
      // socket.emit(e.event, e.data);
    };

    // Create a new channel.
    var channel = channels.create(userid);
    channel.on('notification', notification);
    channel.on('seen', seen);

    socket.on('disconnect', function() {
      // Cleanup
      channels.remove(userid);
      channel.removeListener('notification', notification);
      channel.removeListener('seen', seen);
    });
  });

  return io;
};
