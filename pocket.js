//
// Main app for firing up upd & socket servers
//

var config = require('./config'),
    udp = require('./lib/udp_server'),
    ws = require('./lib/ws_server'),
    redis = require('./lib/redis').create(config.redis);


redis.flushall(function(didSucceed) {
  if (didSucceed) {
    console.log('Successfully flushed redis');
  } else {
    console.log('Failed to flush redis');
  }
});

ws = ws({
  session_host: config.contests_http_host,
  web_port: config.web_port,
  redisClient: redis
});


udp.listen(config.udp_port);

ws.configure('production', function(){
  ws.set('log level', 1);
  ws.set('transports', ['websocket']);
});

ws.configure('development', function(){
  ws.set('transports', ['websocket']);
});

udp.on("notification", function(data) {
  ws.push('notification', data.userid, data.data);
});
