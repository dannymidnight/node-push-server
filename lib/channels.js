var redis = require('./redis'),
    EventEmitter = require('events').EventEmitter;

var channels = {};

var Channel = function() {
  var self = new EventEmitter();
  self.members = 0;
  return self;
};

var Channels = module.exports = function(config) {
  this.store = redis.create(config);
  this.publisher = redis.create(config);
  this.subscriber = redis.create(config);

  // On a redis published message.
  this.subscriber.on('message', function(event, msg) {
    var data = JSON.parse(msg);

    if (event === 'emit') {
      var channelName = data.channel,
          channel = channels[channelName];

      if (channel) {
        channel.emit(data.event, {
          event: data.event,
          data: data.msg
        });
      }
    }
  });

  this.subscriber.subscribe('emit');
};


//
// Publish an event
//
Channels.prototype.emit = function(channel, event, msg) {
  var data = JSON.stringify({
    channel: channel,
    event: event,
    msg: msg
  });

  // Broadcast via redis
  this.publisher.publish('emit', data);
};


//
// Create a new channel or return an existing one.
//
Channels.prototype.create = function(id) {
  var channel;

  if (!channels[id]) {
    console.log('Creating new channel: %s', id);
    channels[id] = new Channel();
  } else {
    console.log('Adding member to channel: %s', id);
  }

  channel = channels[id];
  channel.members++;

  return channel;
};


//
// Decrement a channel members count and destroy when empty.
//
Channels.prototype.remove = function(id) {
  console.log('Removing member channel: %s', id);

  var channel;

  if (channels[id]) {
    channel = channels[id];
    channel.members--;

    if (channel.members <= 0) {
      this.destroy(id);
    }
  }
};

//
// Delete a given channel.
//
Channels.prototype.destroy = function(id) {
  console.log('Destroying channel: %s', id);
  delete channels[id];
};
