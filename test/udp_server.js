
var udp = require('../lib/udp_server');

describe('messages', function() {
  
  it('should handle a malformed json message', function() {
    
    udp.emit("message", "");

  });

});
