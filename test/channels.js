var channels = require('../lib/channels.js'),

    config = require('../config'),
    redisPub = require('../lib/redis').create(config.redis),
    redisSub = require('../lib/redis').create(config.redis),

    sinon = require('sinon');

describe('channels', function() {

  channels.configure({
    publisher: redisPub,
    subscriber: redisSub
  });

  it('should emit event to added sockets', function() {
    var emit = sinon.spy();
    var socket =  { id: 1, emit: emit };

    channels.add('apple', socket);
    channels.emit('apple', 'notification', 'woof');


    sinon.assert.calledWith(emit, 'notification', 'woof');
  });

});


