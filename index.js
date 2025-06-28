const express = require('express');
const http = require('http');
const path = require('path');
const userModule = require('./user');
const serverModule = require('./server');
const watchModule = require('./watch/watch');
const notifierModule = require('./notifiers');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Setup user routes
userModule.setupUserRoutes(app);

// Setup server routes
serverModule.setupServerRoutes(app, userModule.authenticateToken);

// Setup watch routes
watchModule.setupWatchRoutes(app);

// Setup notifier routes
notifierModule.setupNotifierRoutes(app);

// Basic routes
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

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

module.exports = { app, server }; 