const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const userModule = require('./user');
const serverModule = require('./server');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));



// Setup user routes
userModule.setupUserRoutes(app);

// Setup server routes
serverModule.setupServerRoutes(app, userModule.authenticateToken);

// Basic routes
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle message from web client to nodejs server
    socket.on('webToNode', (data) => {
        console.log('Message from web to node:', data);

        // Process the message based on type
        switch (data.type) {
            case 'ping':
                socket.emit('nodeToWeb', {
                    type: 'pong',
                    message: 'Server is alive',
                    timestamp: new Date().toISOString()
                });
                break;
            case 'getStatus':
                socket.emit('nodeToWeb', {
                    type: 'status',
                    data: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                });
                break;
            default:
                socket.emit('nodeToWeb', {
                    type: 'error',
                    message: 'Unknown message type',
                    timestamp: new Date().toISOString()
                });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Function to send message from nodejs to web clients
function sendToAllClients(message) {
    io.emit('nodeToWeb', message);
}

// Start server
server.listen(PORT, () => {
    console.log(`WatchCat monitoring server is running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
    });
});

module.exports = { app, server, sendToAllClients }; 