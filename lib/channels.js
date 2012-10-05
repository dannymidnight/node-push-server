var EventEmitter = require('events').EventEmitter;

var channels = module.exports = new EventEmitter(),
    publisher = null,
    subscriber = null,
    io = null;

var myChannels = [];



channels.configure = function(config) {
  publisher = config.publisher;
  subscriber = config.subscriber;
  io = config.io;

  // This is the actual part we emit the event
  subscriber.on('message', function(event, msg) {
		console.log('message for event ' + event);
    var data = JSON.parse(msg);

    if (event === 'emit') {
      var channel = data.channel,
          sockets = myChannels[channel] || [];

			console.log('almost emit for event ' + event + " for channel " + channel);
      for (var i = 0; i < sockets.length; i++) {
        var id = sockets[i];
        var socket = io.sockets.socket(id);

        if (socket) {
	console.log('About to emit event ' + event + ' to socket ' + id);
          socket.emit(data.event, data.msg);
        }
      }
    }
  });

  subscriber.subscribe('emit');
};


// Publish event to all sockets.
channels.emit = function(channel, event, msg) {
	console.log('emit channel ' + channel + ' for event ' + event);
  var data = JSON.stringify({
    channel: channel,
    event: event,
    msg: msg
  });

  publisher.publish('emit', data);
};


// Add socket id to subscribed channel
channels.add = function(channel, socket) {
  if (!channel) { throw 'Invalid channel'; }
  if (!socket.id) { throw 'Invalid socket'; }
  console.log('add channel ' + channel + ' for socket id ' + socket.id);

  if (!myChannels[channel]) {
    myChannels[channel] = [];
  }

  myChannels[channel].push(socket.id);
};


channels.remove = function(channel, socket) {
	console.log('remove channel ' + channel + ' for socket id ' + socket.id);
  if (myChannels[channel]) {

    var index = myChannels[channel].indexOf(socket.id);
    myChannels[channel].splice(index, 1);

    if (!myChannels[channel].length) {
      channels.destroy(channel);
    }
  }
};


channels.destroy = function(channel) {
	console.log('delete channel ' + channel);
  delete myChannels[channel];
};
