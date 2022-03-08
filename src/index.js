const path = require('path');
const http = require('http');
const express = require('express');
const app = express();
const socketio =  require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage } = require('./utils/messages')
const { addUser,removeUser,getUser,getUsersInRoom } = require('./utils/users')

const server = http.createServer(app);
const io = socketio(server);

//define path for the express config
const publicDirectoryPath = path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));

const port = process.env.PORT || 3000;
let count = 0;
let message = 'Welcome!';
io.on('connection', (socket) => {
    console.log('A New Web-Socket Connection!');
    // socket.emit('message', generateMessage(message));

    //send message to all other except the user which send the message
    // socket.broadcast.emit('message',generateMessage('A new user Joined!'))

    socket.on('join', (options,callback) => {
        const {error,user} = addUser({id:socket.id,...options})
        if(error){
            return callback(error)
        }
        socket.join(user.room);
        socket.emit('message',generateMessage('Admin',message));
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`));
        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (message,callback) => {
        const filter =  new Filter();
        const user = getUser(socket.id);
        if(!user){
            return callback('User not found!')
        }
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message));
        callback();
    })
    socket.on('disconnect',() => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users : getUsersInRoom(user.room)
            })
        }
    })
    socket.on('sendLocation',(coords,callback) => {
        const user = getUser(socket.id);
        if(!user){
            return callback('User not found!')
        }
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })
})

server.listen(port, () => {
    console.log('Server is up on Port number' + port);
})