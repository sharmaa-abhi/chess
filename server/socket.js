const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = 3000;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["*"],
  },
});

let totalPlayes = 0;
let players = {};

let waiting = {
  10: [],
  15: [],
  20: [],
};

let matches = {
  10: [],
  15: [],
  20: [],
};

function removeSocketFromWaitingPeriod(socket) {
  const forEachLoop = [10, 15, 20];
  forEachLoop.forEach((element) => {
    const index = waiting[element].indexOf(socket.id);
    if (index > -1) {
      waiting[element].splice(index, 1);
    }
  });
}

function fireTotalPlayers() {
  io.emit("totalPlayersCountChange", totalPlayes);
}

function fireOnDisconnect(socket) {
  removeSocketFromWaitingPeriod(socket);
  totalPlayes--;
  fireTotalPlayers();
}

function fireOnConnected(socket) {
  socket.on("wantToPlay", function (timer) {
    console.log(timer);
    handlePlayRequest(socket, timer);
  });
  totalPlayes++;
  fireTotalPlayers();
}

function initialSetupMatch( opponentId, socketId ) {
  players[opponentId].emit("matchMade", "w");
  players[socketId].emit("matchMade", "b");

  players[opponentId].on("syncState",function (fen,turn){
    players[socketId].emit("syncStateFromServer", fen, turn);  
  })

  players[socketId].on("syncState",function (fen,turn){
    players[opponentId].emit("syncStateFromServer", fen, turn);  
  })

  players[opponentId].on("gameOver",function (winner){
    players[socketId].emit("gameOverFromServer", winner);  
  })

  players[socketId].on("gameOver",function (winner){
    players[opponentId].emit("gameOverFromServer", winner);  
  })
}

function handlePlayRequest(socket, time) {
  if (waiting[time].length > 0) {
    const opponentId = waiting[element].splice(0, 1)[0];
    matches[time].push({
      [opponentId]: socket.id,
    });
    initialSetupMatch(opponentId, socket.id);
    return;
  }

  if (!waiting[time].includes(socket.id)) {
    waiting[time].push(socket.id);
  }
}

io.on("connection", (socket) => {
  players[socket.id] = socket;
  fireOnConnected(socket);
  socket.on("disconnect", () => fireOnDisconnect(socket));
});

// realtime events
// msg app whatsapp instagram
// bidirectional
// serve -> client , client -> server
// socketio  uses ws (websocket)

// 2 client play match chess game

// Appi request uses http protocol
// https client -> server
// server data inspect that is provided by the client
// server -> client

httpServer.listen(PORT, function () {
  console.log("Your Server is Running at port " + PORT);
});
