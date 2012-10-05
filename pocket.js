//
// Main app for firing up upd & socket servers
//

var config = require('./config'),
    udp = require('./lib/udp_server'),
    ws = require('./lib/ws_server'),

    // Redis
    redis = require('./lib/redis').create(config.redis),
    redisPub = require('./lib/redis').create(config.redis),
    redisSub = require('./lib/redis').create(config.redis),

    // Clustering
    cluster = require('cluster'),
    numCPUs = require('os').cpus().length;


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
    cluster.fork({HEAD_FORK: true});
  }

  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });

  udp.listen(config.udp_port);
  udp.on("notification", function(data) {
    redisPub.publish('notification', JSON.stringify(data));
  });

} else {

  ws = ws({
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


  // FIXME: tidy this up.
  if (process.env.NODE_WORKER_ID == 1) {

    redisSub.on('message', function(channel, msg) {
      var data = JSON.parse(msg);
      if (channel == 'notification') {
        ws.push('notification', data.userid, data.data);
      }
    });

    redisSub.subscribe('notification');
  }
}
