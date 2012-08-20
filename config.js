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
	secretkey: 'pocket',
	contests_http_host: '99designs.com'
};

module.exports = _.extend(config, locals);
