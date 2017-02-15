// setup my socket client
var socket = io();

// Variables for the actual game and the board for rendering
var board, game, playerColor;

// default board config
var cfg = {
    draggable: true,
    position: 'start',
    onDragStart: onPieceDragStart,
    onDrop: onPieceDrop,
    onSnapEnd: onPieceSnapEnd
};

$(document).ready(function() {
    $('#btnLogin').on('click', function() {
        username = $('#username').val();

        if (username.length > 0) {
            socket.emit('login', username);
            $("#login").hide();
            waitingDialog.show("Waiting for Opponent");
        }
    });

    $('#btnResign').on('click', function() {
        socket.emit('resign', { userId: socket.userId, gameId: game.id });

        Resign();
    });
});

function Resign() {
    $('#game').hide();
    $('#login').show();

    game.reset();
}

function AddMove(m) {
    var whiteList = $("#whiteMoveList");
    var blackList = $("#blackMoveList");
    if (m.color == "w") {
        whiteList.append("<li>" + m.san + "</li>");
    } else {
        blackList.append("<li>" + m.san + "</li>");
    }
}

function ShowMoveList(g) {
    var whiteList = $("#whiteMoveList");
    var blackList = $("#blackMoveList");

    whiteList.empty();
    blackList.empty();

    var history = g.history({ verbose: true });
    history.forEach(function(o) {
        AddMove(o);
    }, this);
}

socket.on('connect_failed', function() {
    waitingDialog.hide();
});

socket.on('startGame', function(data) {
    $("#login").hide();
    $("#game").show();

    playerColor = data.playerColor;

    InitGame('board', $.extend(cfg, { orientation: playerColor }));

    waitingDialog.hide();
});

// called when the server calls socket.broadcast('move')
socket.on('move', function(msg) {
    game.move(msg.move);
    board.position(game.fen()); // fen is the board layout
    AddMove(msg.move);
});

socket.on('resign', function(msg) {
    Resign();
});

socket.on('logout', function(msg) {
    Resign();
});

function InitGame(boardId, config) {
    if (config === undefined)
        config = cfg;

    if (boardId === undefined)
        boardId = 'board';

    board = ChessBoard(boardId, config);
    game = new Chess();
}

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
function onPieceDragStart(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
        (game.turn() !== playerColor[0])) {
        return false;
    }
};

function onPieceDrop(source, target) {
    // see if the move is legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) {
        return 'snapback';
    } else {
        socket.emit('move', {
            move: move,
            board: game.fen()
        });
        AddMove(move);
    }
};

// update the board position after the piece snap 
// for castling, en passant, pawn promotion
function onPieceSnapEnd() {
    board.position(game.fen());
};