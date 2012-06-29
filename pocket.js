//
// Main app for firing up pocket client and server
//

var config = require('./config'),
    client = require('./client'),
    server = require('./server');

client.on("notification", function(data) {
  server.emit("notification", data.userid, data.data);
});
