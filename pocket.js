//
// Main app for firing up upd & socket servers
//

var config = require('./config'),
    udp = require('./lib/udp_server'),
    ws = require('./lib/ws_server');


ws = ws(config);
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
