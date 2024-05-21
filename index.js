const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

let rooms = [];

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());

app.get("/", (req, res) => {
  return res.send("hello world");
});

io.on("connection", (socket) => {
  console.log("a user connected");
 
  socket.on("createRoom", (data) => {
    console.log(data)
    const room = {
      id: uuidv4(),
      users: [
        {
          name: data.name,
          socketId: socket.id,
          roomid: data.room,
        },
      ],
    };
    rooms.push(room);
    socket.join(room.id);
    
    socket.emit("roomcreated",{
      room: room.id,
      name: room.users[0].name,
    });
  });

  socket.on("joinroom", (data) => {
    // console.log(data);
    const room = rooms.find(room => room.users.some(user => user.roomid === data.room));
    if (room) {
      room.users.push({
        name: data.name,
        socketId: socket.id,
      });
      socket.join(room.id);
      
      socket.emit("joinedroom",{
        room: room.id,
        name: room.users[0].name,
      });
    }
  });

  socket.on("outgoingMessage", (data) => {
   
    const room = rooms.find((room) => room.id == data.room);
    
    if (room) {
      room.users
      .filter(user => user.socketId !== socket.id)
      
      .forEach(user => io.to(user.socketId).emit("IncomingMessage", {message: data.message, name: data.name}));
        
    }
  });
  socket.on("getname", (socketId) => {
    for (let room of rooms) {
      let user = room.users.find(user => user.socketId === socketId);
      if (user) {
        io.to(socketId).emit("gotname", user.name);
        break;
      }
    }
  });
  
 


});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});