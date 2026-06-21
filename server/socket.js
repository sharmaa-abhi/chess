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

function fireTotalPlayers() {
  io.emit("totalPlayersCountChange", totalPlayes);
}

function fireOnDisconnect(socket) {
  totalPlayes--;
  fireTotalPlayers();
}

function fireOnConnected(socket) {
  totalPlayes++;
  fireTotalPlayers();
}

io.on("connection", (socket) => {
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
