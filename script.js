// NOTE: this example uses the chess.js library:
// https://github.com/jhlywa/chess.js

var board = null;
var game = new Chess();
var $status = $("#status");
var $fen = $("#fen");
var $pgn = $("#pgn");
let currentPlayer = null;

function onDragStart(source, piece, position, orientation) {


  if (game.turn() !== currentPlayer) return false;


  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

  // only pick up pieces for the side to move
  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: "q", // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return "snapback";
  socket.emit("syncState", game.fen(), game.turn());
  updateStatus();
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
  board.position(game.fen());
}

function updateStatus() {
  var status = "";

  var moveColor = "White";
  if (game.turn() === "b") {
    moveColor = "Black";
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = "Game over, " + moveColor + " is in checkmate.";
  }

  // draw?
  else if (game.in_draw()) {
    status = "Game over, drawn position";
  }

  // game still on
  else {
    status = moveColor + " to move";

    // check?
    if (game.in_check()) {
      status += ", " + moveColor + " is in check";
    }
  }

  $status.html(status);
  $fen.html(game.fen());
  $pgn.html(game.pgn());
}

function onChange() {
  if(game.game_over()){
    if(game.in_checkmate()) {
      const winner = game.turn() === "b" ? "W" : "B";
      socket.emit("gameOver", winner);
    }
  }
}

var config = {
  draggable: true,
  position: "start",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onChange:onChange,
  onSnapEnd: onSnapEnd,
};
board = Chessboard("myBoard", config);

updateStatus();

function handleButtonClick(event) {
  const timer = Number(event.target.getAttribute("data-timer"));
  socket.emit("wantToPlay", { timer: timer });
  $("#mainElement").hide();
  $("#waitingPara").show();

  // alert(timer);
}

document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementsByClassName("timer-button");
  for (let index = 0; index < button.length; index++) {
    const btn = button[index];
    btn.addEventListener("click", handleButtonClick);
  }
});

const socket = io("http://localhost:3000");
// console.log(socket);

socket.on("totalPlayersCountChange", function (totalPlayersCount) {
  $("totalPlayers").html("Total Player : " + totalPlayersCount);
});

socket.on("matchMade", (colour) => {
  alert("Match Made! You are playing as " + colour);
  $("#mainElement").hide();
  $("#waitingPara").show();
  const currentPlayer = colour === "b" ? "Black" : "White";
  $("#buttonsParent").html(
    "<p id= 'youArePlayingAs' >You Are Playing As " + currentPlayer + "</p>",
  );
  game.reset();
  board.clear();
  board.start();
  board.orientation(currentPlayer.toLowerCase());
});

socket.on("syncStateFromServer", function(fen, turn){
  game.load(fen);
  game.setTurn(turn);
  board.position(fen);

});


socket.on("gameOverFromServer", function(winner){
  const message = winner === currentPlayer ? "You won the match :)" : "You lost the match :(";
  alert(message); 
  window.location.reload(); 
});