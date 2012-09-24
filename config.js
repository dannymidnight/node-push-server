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
    port: "9979",
    host: "tetra.redistogo.com",
    auth: "9ebdcea4302e7d847d8bb430d19792cf"
  }
};

module.exports = _.extend(config, locals);
