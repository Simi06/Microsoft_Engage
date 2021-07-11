const express = require('express');
const path = require('path');
const app = express()
const cors = require('cors')
app.use(cors())
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname,"views")));
app.use(express.static(path.join(__dirname,"public")));

app.get(["/"],(req, res) => {
  res.sendFile(path.join(__dirname,"views/index.html"));
});

app.get(["/login"],(req, res) => {
  res.sendFile(path.join(__dirname,"views/login.html"));
});
app.get(["/signup"],(req, res) => {
  res.sendFile(path.join(__dirname,"views/signup.html"));
});

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
 })

app.get(["/room"],(req, res) => {
  res.sendFile(path.join(__dirname,"views/room.html"));
});


io.on('connection', socket => {
  console.log("conn");
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })

  socket.on('screen', (data) => {
    data = JSON.parse(data)
    const room = data.room
    const imgStr = data.image

    socket.broadcast.to(room).emit('screen', imgStr)
  })

})

server.listen(process.env.PORT||3030)
