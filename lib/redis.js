
var redis = require('socket.io/node_modules/redis');

var create = function(options, callback) {
  var client = redis.createClient(options.port, options.host);
  if (options.auth) {
    client.auth(options.auth, callback);
  }
  return client;  
};

module.exports = {
  create: create
};
