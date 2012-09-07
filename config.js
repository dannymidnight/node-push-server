_ = require('underscore');

try {
  var locals = require('./locals');
} catch (e) {
  locals = {};
  console.log('WARN: Missing locals config file');
}

// Defaults
var config = {
  udp_port: 4000,
  web_port: 8080,
  contests_http_host: '99designs.com',

  redis: {
    port: "9530",
    host: "barb.redistogo.com",
    auth: "e8c0ba434b2fddeb96b27c499ec07469"
  }
};

module.exports = _.extend(config, locals);
