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
    var data = JSON.parse(msg);

    if (event === 'emit') {
      var channel = data.channel,
          sockets = myChannels[channel] || [];

      for (var i = 0; i < sockets.length; i++) {
        var id = sockets[i];
        var socket = io.sockets.socket(id);
        socket.emit(data.event, data.msg);
      }
    }
  });

  subscriber.subscribe('emit');
};


// Publish event to all sockets.
channels.emit = function(channel, event, msg) {
  var data = JSON.stringify({
    channel: channel,
    event: event,
    msg: msg
  });

  publisher.publish('emit', data);
};


// Add socket id to subscribed channel
channels.add = function(channel, socket) {
  if (!socket.id) { throw 'Invalid socket'; }

  if (!myChannels[channel]) {
    myChannels[channel] = [];
  }

  myChannels[channel].push(socket.id);
};


channels.remove = function(channel, socket) {
  if (myChannels[channel]) {

    var index = myChannels[channel].indexOf(socket.id);
    myChannels[channel].splice(index, 1);

    if (!myChannels[channel].length) {
      channels.destroy(channel);
    }
  }
};


channels.destroy = function(channel) {
  delete myChannels[channel];
};
