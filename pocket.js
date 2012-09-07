//
// Main app for firing up upd & socket servers
//

var config = require('./config'),
    udp = require('./lib/udp_server'),
    ws = require('./lib/ws_server');


ws = ws({
  session_host: config.contests_http_host,
  web_port: config.web_port,
  redis_host: config.redis.host,
  redis_port: config.redis.port,
  redis_auth: config.redis.auth
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
