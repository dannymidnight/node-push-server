// Setup loggers for server & client

var args = process.argv.splice(2);

var winston	= require('winston');

var logger_options = {
	timestamp: true
};
if (args.indexOf('-v') == -1) {
	logger_options['level'] = 'error';
}

winston.loggers.add('server', {
	console: logger_options
});

winston.loggers.add('client', {
	console: logger_options
});
