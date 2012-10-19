//
// Main app for firing up upd & socket servers
//

var config = require('./config'),
    udp = require('./lib/udp_server'),
    ws = require('./lib/ws_server'),

    // Clustering
    cluster = require('cluster'),
    numCPUs = require('os').cpus().length,

    // Redis channels.
    redis = require('./lib/redis').create(config.redis),
    Channels = require('./lib/channels');

if (cluster.isMaster) {

  redis.flushall(function(didSucceed) {
    if (didSucceed) {
      console.log('Successfully flushed redis');
    } else {
      console.log('Failed to flush redis');
    }
  });

  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });

  // TODO - split this out.
  var channels = new Channels({ redis: config.redis });
  udp.listen(config.udp_port);
  udp.on("notification", function(data) {
    channels.emit(data.userid, 'notification', JSON.stringify(data));
  });
  // --

} else {

  ws = ws({
    channels: new Channels({ redis: config.redis }),
    session_host: config.contests_http_host,
    web_port: config.web_port
  });

  ws.configure('production', function(){
    ws.set('log level', 1);
    ws.set('transports', ['websocket']);
  });

  ws.configure('development', function(){
    ws.set('transports', ['websocket']);
  });
}
