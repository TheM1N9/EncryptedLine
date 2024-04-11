// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const allowedUsernames = new Set(['user1', 'user2', 'user3']);
const activeUsers = new Map(); // Use a Map to store socket IDs by username

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
        if (socket.username) {
            activeUsers.delete(socket.username);
            io.emit('user left', socket.username);
            io.emit('update active users', Array.from(activeUsers.keys())); // Emit usernames only
        }
    });

    socket.on('join', (username) => {
        if (allowedUsernames.has(username) && !activeUsers.has(username)) {
            console.log(username + ' joined the chat');
            socket.username = username;
            activeUsers.set(username, socket.id); // Store socket ID by username
            io.emit('user joined', username);
            io.emit('update active users', Array.from(activeUsers.keys())); // Emit usernames only
        } else {
            console.log('Unauthorized user attempted to join: ' + username);
            socket.emit('authentication failed');
        }
    });

    socket.on('chat message', (data) => {
        console.log('message: ' + data.message);
        io.emit('chat message', { username: data.username, message: data.message });
    });

    socket.on('get active users', (callback) => {
        callback(Array.from(activeUsers.keys())); // Emit usernames only
    });

    socket.on('typing', (isTyping) => {
        io.emit('typing', isTyping);
    });

    // Handle private messages
    // server.js

// Handle private messages
socket.on('private message', (data) => {
    const { recipient, message } = data;
    if (activeUsers.has(recipient)) {
        const recipientSocketId = activeUsers.get(recipient);
        io.to(recipientSocketId).emit('private message', { sender: socket.username, recipient, message }); // Include sender information
        socket.emit('private message', { sender: socket.username, recipient, message }); // Also send the message to the sender
    } else {
        socket.emit('chat message', { username: 'System', message: `User ${recipient} is not online.` }); // Notify the sender that the recipient is not online
    }
});

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
