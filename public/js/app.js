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
            $("#login").hide();
            $('#game').show();
            InitGame();
        }
    });

    $('#btnResign').on('click', function() {
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
    UpdateGameStatus();
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

function UpdateGameStatus() {
    var turnColor = (game.turn() === 'w' ? 'White' : 'Black');

    if (game.in_check())
        $("#gameStatus").removeClass('alert-info').addClass('alert-danger').text('CHECK');
    else
        $("#gameStatus").removeClass('alert-danger').removeClass('alert-warning').addClass('alert-info').text(turnColor + 's Turn');

    if (game.game_over()) {
        if (game.in_checkmate())
            $("#gameStatus").removeClass('alert-info').addClass('alert-danger').text('CHECK MATE');
        else if (game.in_draw())
            $("#gameStatus").removeClass('alert-info').addClass('alert-warning').text('DRAW');
        else if (game.in_stalemate())
            $("#gameStatus").removeClass('alert-info').addClass('alert-warning').text('STALEMATE');
        else if (game.in_threefold_repetition())
            $("#gameStatus").removeClass('alert-info').addClass('alert-warning').text('3 MOVE REPITION - GAME OVER');
        else if (game.insufficient_material())
            $("#gameStatus").removeClass('alert-info').addClass('alert-warning').text('INSUFFICIENT MATERIAL TO PALY - GAME OVER');
    }
}

function InitGame(boardId, config) {
    if (config === undefined)
        config = cfg;

    if (boardId === undefined)
        boardId = 'board';

    board = ChessBoard(boardId, config);
    game = new Chess();

    $("#whiteMoveList").empty();
    $("#blackMoveList").empty();
}

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
function onPieceDragStart(source, piece, position, orientation) {
    if (game.game_over() === true ||
        (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
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
        AddMove(move);
    }
};

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onPieceSnapEnd() {
    board.position(game.fen());
};

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('./service-worker.js')
        .then(function() { console.log('Service Worker registered'); });
}