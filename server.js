const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Utility function to read JSON files
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return {};
    }
}

// Utility function to write JSON files
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}

// Get all servers (hide passwords)
function getAllServers() {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        // Hide passwords in response
        const safeServers = {};
        for (const [serverId, server] of Object.entries(servers)) {
            safeServers[serverId] = {
                ...server,
                password: server.password ? '******' : ''
            };
        }
        
        return {
            success: true,
            servers: safeServers
        };
    } catch (error) {
        console.error('Get servers error:', error);
        return {
            success: false,
            message: 'Error reading server data'
        };
    }
}

// Get single server (hide password)
function getServer(serverId) {
    try {
        const servers = readJsonFile('./data/servers.json');
        const server = servers[serverId];
        
        if (!server) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        return {
            success: true,
            server: {
                ...server,
                password: server.password ? '******' : ''
            }
        };
    } catch (error) {
        console.error('Get server error:', error);
        return {
            success: false,
            message: 'Error reading server data'
        };
    }
}

// Create new server
function createServer(serverData) {
    try {
        const servers = readJsonFile('./data/servers.json');
        const serverId = uuidv4();
        
        // Validate required fields
        if (!serverData.name || !serverData.ip) {
            return {
                success: false,
                message: 'Server name and IP are required'
            };
        }
        
        // Create new server object
        const newServer = {
            name: serverData.name,
            desc: serverData.desc || '',
            ip: serverData.ip,
            username: serverData.username || 'root',
            password: serverData.password || '',
            watchlist: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        servers[serverId] = newServer;
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Server created successfully',
            serverId: serverId,
            server: {
                ...newServer,
                password: newServer.password ? '******' : ''
            }
        };
    } catch (error) {
        console.error('Create server error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Update server
function updateServer(serverId, serverData) {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        if (!servers[serverId]) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        // Update server data (preserve watchlist)
        const updatedServer = {
            ...servers[serverId],
            name: serverData.name || servers[serverId].name,
            desc: serverData.desc !== undefined ? serverData.desc : servers[serverId].desc,
            ip: serverData.ip || servers[serverId].ip,
            username: serverData.username || servers[serverId].username,
            updatedAt: new Date().toISOString()
        };
        
        // Only update password if provided
        if (serverData.password && serverData.password !== '******') {
            updatedServer.password = serverData.password;
        }
        
        servers[serverId] = updatedServer;
        
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Server updated successfully',
            server: {
                ...updatedServer,
                password: updatedServer.password ? '******' : ''
            }
        };
    } catch (error) {
        console.error('Update server error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Delete server
function deleteServer(serverId) {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        if (!servers[serverId]) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        delete servers[serverId];
        
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Server deleted successfully'
        };
    } catch (error) {
        console.error('Delete server error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Add watch task to server
function addWatchTask(serverId, watchData) {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        if (!servers[serverId]) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        // Validate required fields
        if (!watchData.name || !watchData.period) {
            return {
                success: false,
                message: 'Watch name and period are required'
            };
        }
        
        const watchId = uuidv4();
        const newWatch = {
            id: watchId,
            name: watchData.name,
            enable: watchData.enable !== undefined ? watchData.enable : true,
            period: watchData.period,
            watch: {
                template: watchData.template || '',
                data: watchData.data || {},
                alarmlist: []
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        servers[serverId].watchlist.push(newWatch);
        servers[serverId].updatedAt = new Date().toISOString();
        
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Watch task added successfully',
            watchId: watchId,
            watch: newWatch
        };
    } catch (error) {
        console.error('Add watch task error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Update watch task
function updateWatchTask(serverId, watchId, watchData) {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        if (!servers[serverId]) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        const watchIndex = servers[serverId].watchlist.findIndex(w => w.id === watchId);
        if (watchIndex === -1) {
            return {
                success: false,
                message: 'Watch task not found'
            };
        }
        
        // Update watch task
        const existingWatch = servers[serverId].watchlist[watchIndex];
        const updatedWatch = {
            ...existingWatch,
            name: watchData.name || existingWatch.name,
            enable: watchData.enable !== undefined ? watchData.enable : existingWatch.enable,
            period: watchData.period || existingWatch.period,
            watch: {
                ...existingWatch.watch,
                template: watchData.template !== undefined ? watchData.template : existingWatch.watch.template,
                data: watchData.data !== undefined ? watchData.data : existingWatch.watch.data
            },
            updatedAt: new Date().toISOString()
        };
        
        servers[serverId].watchlist[watchIndex] = updatedWatch;
        servers[serverId].updatedAt = new Date().toISOString();
        
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Watch task updated successfully',
            watch: updatedWatch
        };
    } catch (error) {
        console.error('Update watch task error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Delete watch task
function deleteWatchTask(serverId, watchId) {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        if (!servers[serverId]) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        const watchIndex = servers[serverId].watchlist.findIndex(w => w.id === watchId);
        if (watchIndex === -1) {
            return {
                success: false,
                message: 'Watch task not found'
            };
        }
        
        servers[serverId].watchlist.splice(watchIndex, 1);
        servers[serverId].updatedAt = new Date().toISOString();
        
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Watch task deleted successfully'
        };
    } catch (error) {
        console.error('Delete watch task error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Add alarm to watch task
function addAlarm(serverId, watchId, alarmData) {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        if (!servers[serverId]) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        const watchIndex = servers[serverId].watchlist.findIndex(w => w.id === watchId);
        if (watchIndex === -1) {
            return {
                success: false,
                message: 'Watch task not found'
            };
        }
        
        if (!alarmData.name || !alarmData.template) {
            return {
                success: false,
                message: 'Alarm name and template are required'
            };
        }
        
        const alarmId = uuidv4();
        const newAlarm = {
            id: alarmId,
            name: alarmData.name,
            template: alarmData.template,
            data: alarmData.data || {},
            createdAt: new Date().toISOString()
        };
        
        servers[serverId].watchlist[watchIndex].watch.alarmlist.push(newAlarm);
        servers[serverId].watchlist[watchIndex].updatedAt = new Date().toISOString();
        servers[serverId].updatedAt = new Date().toISOString();
        
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Alarm added successfully',
            alarmId: alarmId,
            alarm: newAlarm
        };
    } catch (error) {
        console.error('Add alarm error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Delete alarm
function deleteAlarm(serverId, watchId, alarmId) {
    try {
        const servers = readJsonFile('./data/servers.json');
        
        if (!servers[serverId]) {
            return {
                success: false,
                message: 'Server not found'
            };
        }
        
        const watchIndex = servers[serverId].watchlist.findIndex(w => w.id === watchId);
        if (watchIndex === -1) {
            return {
                success: false,
                message: 'Watch task not found'
            };
        }
        
        const alarmIndex = servers[serverId].watchlist[watchIndex].watch.alarmlist.findIndex(a => a.id === alarmId);
        if (alarmIndex === -1) {
            return {
                success: false,
                message: 'Alarm not found'
            };
        }
        
        servers[serverId].watchlist[watchIndex].watch.alarmlist.splice(alarmIndex, 1);
        servers[serverId].watchlist[watchIndex].updatedAt = new Date().toISOString();
        servers[serverId].updatedAt = new Date().toISOString();
        
        const saved = writeJsonFile('./data/servers.json', servers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving server data'
            };
        }
        
        return {
            success: true,
            message: 'Alarm deleted successfully'
        };
    } catch (error) {
        console.error('Delete alarm error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Setup server routes
function setupServerRoutes(app, authenticateToken) {
    // Get all servers
    app.get('/api/servers', authenticateToken, (req, res) => {
        const result = getAllServers();
        res.status(result.success ? 200 : 500).json(result);
    });
    
    // Get single server
    app.get('/api/servers/:serverId', authenticateToken, (req, res) => {
        const result = getServer(req.params.serverId);
        res.status(result.success ? 200 : 404).json(result);
    });
    
    // Create server
    app.post('/api/servers', authenticateToken, (req, res) => {
        const result = createServer(req.body);
        res.status(result.success ? 201 : 400).json(result);
    });
    
    // Update server
    app.put('/api/servers/:serverId', authenticateToken, (req, res) => {
        const result = updateServer(req.params.serverId, req.body);
        res.status(result.success ? 200 : 404).json(result);
    });
    
    // Delete server
    app.delete('/api/servers/:serverId', authenticateToken, (req, res) => {
        const result = deleteServer(req.params.serverId);
        res.status(result.success ? 200 : 404).json(result);
    });
    
    // Add watch task
    app.post('/api/servers/:serverId/watch', authenticateToken, (req, res) => {
        const result = addWatchTask(req.params.serverId, req.body);
        res.status(result.success ? 201 : 400).json(result);
    });
    
    // Update watch task
    app.put('/api/servers/:serverId/watch/:watchId', authenticateToken, (req, res) => {
        const result = updateWatchTask(req.params.serverId, req.params.watchId, req.body);
        res.status(result.success ? 200 : 404).json(result);
    });
    
    // Delete watch task
    app.delete('/api/servers/:serverId/watch/:watchId', authenticateToken, (req, res) => {
        const result = deleteWatchTask(req.params.serverId, req.params.watchId);
        res.status(result.success ? 200 : 404).json(result);
    });
    
    // Add alarm
    app.post('/api/servers/:serverId/watch/:watchId/alarm', authenticateToken, (req, res) => {
        const result = addAlarm(req.params.serverId, req.params.watchId, req.body);
        res.status(result.success ? 201 : 400).json(result);
    });
    
    // Delete alarm
    app.delete('/api/servers/:serverId/watch/:watchId/alarm/:alarmId', authenticateToken, (req, res) => {
        const result = deleteAlarm(req.params.serverId, req.params.watchId, req.params.alarmId);
        res.status(result.success ? 200 : 404).json(result);
    });
}

module.exports = {
    getAllServers,
    getServer,
    createServer,
    updateServer,
    deleteServer,
    addWatchTask,
    updateWatchTask,
    deleteWatchTask,
    addAlarm,
    deleteAlarm,
    setupServerRoutes
}; 