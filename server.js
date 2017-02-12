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
// Called when the client calls socket.emit('move')
io.on('connection', function(socket) {
    console.log('Client Connected: ' + socket.id);

    socket.on('move', function(msg) {
        console.log("Move Made");
        socket.broadcast.emit('move', msg);
    });
});