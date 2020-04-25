const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const routes = require('./routes/routes');

const { Room } = require("./utils/room");

app.use(express.static('public'));
app.use('/', routes);

app.set('views', './views');
app.set('view engine', 'ejs');

let rooms = [];

io.on('connection', (socket) => {
    console.log(socket.id)

    /* Envoyer les rooms au client */
    socket.emit('send-rooms', rooms)

    /* Créer une nouvelle room */
    socket.on('create-room', (data) => {
        let room = new Room(socket.id, data.name, data.number)
        socket.join(socket.id);
        rooms.push(room);
        console.log(rooms);
        socket.emit('room-created', room);
        io.emit('new-room', room);
    })

    /* Rejoindre une room */
    socket.on('join-room', (room) => {
        let roomToJoin = rooms.find(el => el.id === room );
        let playersLength = roomToJoin.players.length + 1;
        let playersNbr = parseInt(roomToJoin.playersNbr)
            if (playersLength <= playersNbr) {
                roomToJoin.newPlayer(socket.id);
                io.to(room).emit('player-join', socket.id);
                if (playersLength === playersNbr) deleteRoom(roomToJoin);
            }
    })

    /* Gérer les déconnexions */
    socket.on('disconnect', () => {
        let room = rooms.find(el => el.id === socket.id);
        if (room) {
            deleteRoom(room);
        }
    });
});

const deleteRoom = (room) => {
    let roomIndex = rooms.indexOf(room);
    let roomId = room.id;
    rooms.splice(roomIndex, 1);
    io.emit('delete-room', roomId);
}

http.listen(3000, function () {
    console.log('Example app listening on port 3000!');
})