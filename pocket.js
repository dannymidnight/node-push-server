//
// Main app for firing up pocket client and server
//

var config = require('./config'),
    client = require('./client'),
    server = require('./server');

server.configure('production', function(){
  server.set('log level', 1);
  server.set('transports', ['websocket']);
});

server.configure('development', function(){
  server.set('transports', ['websocket']);
});

client.on("notification", function(data) {
  server.emit("notification", data.userid, data.data);
});
