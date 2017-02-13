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
// Store the users connected and the rooms
//////////////////////////////////////////////////////
var lobbyUsers = {}; // Users waiting on gameState
var users = {}; // Users on system
var activeGames = {}; // Active Games on System

//////////////////////////////////////////////////////
// Hook up events for new connections that come in to the server
//////////////////////////////////////////////////////
// Called when the client calls socket.emit('move')
io.on('connection', function(socket) {
    console.log('New connection ' + socket.id);

    socket.on('login', function(userId) {
        console.log(userId + ' joining lobby');
        socket.userId = userId;

        if (!users[userId]) {
            console.log('creating new user');
            users[userId] = { userId: socket.userId, games: {} };
        } else {
            console.log('user found!');
            Object.keys(users[userId].games).forEach(function(gameId) {
                console.log('gameid - ' + gameId);
            });
        }

        lobbyUsers[userId] = socket;

        if (Object.keys(lobbyUsers).length >= 2) {
            var opponentId;

            for (var o in lobbyUsers) {
                if (lobbyUsers[o].userId !== socket.userId) {
                    opponentId = o;
                    break;
                }
            }

            console.log("Creating Game between" + lobbyUsers[userId].id + " and " + lobbyUsers[opponentId].id)
            var game = {
                id: Object.keys(activeGames).length + 1,
                board: null,
                users: { white: opponentId, black: socket.userId }
            };

            socket.gameId = game.id;
            activeGames[game.id] = game;

            users[opponentId].games[game.id] = game.id;
            users[socket.userId].games[game.id] = game.id;

            console.log('Starting game: ' + game.id);
            lobbyUsers[opponentId].emit('startGame', { game: game, playerColor: 'white' });
            lobbyUsers[socket.userId].emit('startGame', { game: game, playerColor: 'black' });

            delete lobbyUsers[opponentId];
            delete lobbyUsers[socket.userId];
        } else {
            socket.broadcast.emit('joinlobby', socket.userId);
        }
    });

    socket.on('invite', function(opponentId) {
        console.log('got an invite from: ' + socket.userId + ' --> ' + opponentId);

        socket.broadcast.emit('leavelobby', socket.userId);
        socket.broadcast.emit('leavelobby', opponentId);


        var game = {
            id: Math.floor((Math.random() * 100) + 1),
            board: null,
            users: { white: socket.userId, black: opponentId }
        };

        socket.gameId = game.id;
        activeGames[game.id] = game;

        users[game.users.white].games[game.id] = game.id;
        users[game.users.black].games[game.id] = game.id;

        console.log('starting game: ' + game.id);
        lobbyUsers[game.users.white].emit('joingame', { game: game, color: 'white' });
        lobbyUsers[game.users.black].emit('joingame', { game: game, color: 'black' });

        delete lobbyUsers[game.users.white];
        delete lobbyUsers[game.users.black];

        socket.broadcast.emit('gameadd', { gameId: game.id, gameState: game });
    });

    socket.on('move', function(msg) {
        console.log("Move Made");
        socket.broadcast.emit('move', msg);
    });
});