//////////////////////////////////////////////////////
// Import node modules
//////////////////////////////////////////////////////
var express = require('express'),
    app = express(), // Create the app
    http = require('http'),
    socketIo = require('socket.io');

const PORT = process.env.PORT || 8080;
//////////////////////////////////////////////////////
// start webserver on port 8080
//////////////////////////////////////////////////////
var server = http.createServer(app);
var io = socketIo.listen(server);
server.listen(PORT);
console.log('Server Listening on ' + PORT);

//////////////////////////////////////////////////////
// Tell express web server where our html lives
//////////////////////////////////////////////////////
app.use(express.static(__dirname + '/public'));

//////////////////////////////////////////////////////
// Store the lines drawn
//////////////////////////////////////////////////////
var linesDrawn = [];

//////////////////////////////////////////////////////
// Hook up events for new connections that come in to the server
//////////////////////////////////////////////////////
io.on('connection', function(socket) {
    // Send all history to the client that connected
    for (var i in linesDrawn) {
        socket.emit('drawEvent', { line: linesDrawn[i] });
    }

    // Add "drawEvent" message handler.
    socket.on('drawEvent', function(data) {
        // Add received line to history
        linesDrawn.push(data.line);
        // Send line to all clients
        io.emit('drawEvent', { line: data.line });
    });
});