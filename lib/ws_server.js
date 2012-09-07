//
// Socket.io server for dishing out web sockets and shit.
//

module.exports = function(options) {

  var	sha1    = require('sha1'),
      winston	= require('winston'),
      util		= require('util'),
      rest		= require('restler'),
      io      = require('socket.io').listen(options.web_port),
      redis   = require('socket.io/node_modules/redis'),

      serverlog = winston.loggers.get('server');


  //
  // Create a redis client based on config options
  //
  function redisClient(callback) {
    var client = redis.createClient(options.redis_port, options.redis_host);
    if (options.redis_auth) {
      client.auth(options.redis_auth, callback);
    }
    return client;
  }

  var RedisStore = require('socket.io/lib/stores/redis')
  , pub = redisClient()
  , sub = redisClient()
  , client = redisClient();

  io.configure(function (){
    // Use RedisStore for scaling out server
    io.set('store', new RedisStore({
      redisPub: pub,
      redisSub: sub,
      redisClient: client
    }));

    // Authorize via session ownership check
    io.set('authorization', function (handshakeData, callback) {
      if (handshakeData.query.userid && handshakeData.query.sessionid) {
        var userid = handshakeData.query.userid,
         sessionid = handshakeData.query.sessionid,
         host = options.session_host,
         sessionCheckUrl = 'http://' + host + '/users/sessioncheck/' + userid + "/" + sessionid;

        rest
          .get(sessionCheckUrl)
          .on('complete', function(data,response) {
            if (response && response.statusCode == 200 && data) {
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
  });

  // Push to a user
  io.push = function(event, userid, data) {
    if (Object.keys(io.sockets.clients(userid)).length) {
      serverlog.info(util.format('[server] Emitted %s to user: #%d', event, userid));
      io.sockets.in(userid).emit(event, data);
    }
  };

  return io;
};