// Main application logic
let socket;
let currentUser = null;

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    checkAuthentication();

    // Initialize socket connection
    initializeSocket();

    // Initialize navigation
    initializeNavigation();

    // Initialize header actions
    initializeHeaderActions();

    // Load initial data
    loadDashboardData();
});

// Authentication check
function checkAuthentication() {
    const token = localStorage.getItem('watchcat_token');
    const user = localStorage.getItem('watchcat_user');

    if (!token || !user) {
        window.location.href = '/login.html';
        return;
    }

    try {
        currentUser = JSON.parse(user);
        document.getElementById('userInfo').textContent = `Welcome, ${currentUser.username}`;
        document.getElementById('headerUserName').textContent = currentUser.username;
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = '/login.html';
    }
}

// Socket.IO initialization
function initializeSocket() {
    socket = io();

    // Connection status handling
    socket.on('connect', function () {
        console.log('Connected to server');
        updateConnectionStatus(true);

        // Send initial ping
        sendToNode({
            type: 'ping',
            message: 'Client connected'
        });
    });

    socket.on('disconnect', function () {
        console.log('Disconnected from server');
        updateConnectionStatus(false);
    });

    // Handle messages from nodejs server
    socket.on('nodeToWeb', function (data) {
        console.log('Message from node to web:', data);
        handleNodeMessage(data);
    });

    // Connection error handling
    socket.on('connect_error', function (error) {
        console.error('Connection error:', error);
        updateConnectionStatus(false);
    });
}

// Send message to nodejs server
function sendToNode(data) {
    if (socket && socket.connected) {
        socket.emit('webToNode', data);
    } else {
        console.warn('Socket not connected, cannot send message');
    }
}

// Handle messages from nodejs server
function handleNodeMessage(data) {
    switch (data.type) {
        case 'pong':
            console.log('Server responded to ping:', data.message);
            break;
        case 'status':
            updateServerStatus(data.data);
            break;
        case 'serverUpdate':
            updateServerList(data.data);
            break;
        case 'serviceUpdate':
            updateServiceList(data.data);
            break;
        case 'alertUpdate':
            updateAlertList(data.data);
            break;
        case 'error':
            console.error('Server error:', data.message);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetSection = this.getAttribute('data-section');

            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            this.classList.add('active');

            // Update active content section
            contentSections.forEach(section => section.classList.remove('active'));
            const targetContent = document.getElementById(targetSection);
            if (targetContent) {
                targetContent.classList.add('active');

                // Update page title
                const sectionTitles = {
                    dashboard: 'Dashboard',
                    servers: 'Server Management',
                    services: 'Service Management',
                    alerts: 'Alert Management'
                };
                pageTitle.textContent = sectionTitles[targetSection] || 'Dashboard';

                // Load section-specific data
                loadSectionData(targetSection);
            }
        });
    });
}



// Update connection status indicator
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    if (isConnected) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'connection-status connected';
    } else {
        statusElement.textContent = 'Disconnected';
        statusElement.className = 'connection-status disconnected';
    }
}

// Load dashboard data
function loadDashboardData() {
    // Request server status from nodejs
    sendToNode({
        type: 'getStatus',
        message: 'Request server status'
    });

    // Request dashboard statistics
    sendToNode({
        type: 'getDashboardStats',
        message: 'Request dashboard statistics'
    });
}

// Load section-specific data
function loadSectionData(section) {
    switch (section) {
        case 'servers':
            loadServers();
            break;
        case 'services':
            sendToNode({
                type: 'getServices',
                message: 'Request service list'
            });
            break;
        case 'alerts':
            sendToNode({
                type: 'getAlerts',
                message: 'Request alert list'
            });
            break;
    }
}

// Update server status display
function updateServerStatus(statusData) {
    console.log('Server status updated:', statusData);

    // Update any status displays if needed
    if (statusData.uptime) {
        console.log(`Server uptime: ${Math.floor(statusData.uptime)} seconds`);
    }
}

// Update server list
function updateServerList(servers) {
    const serverListBody = document.getElementById('serverList');

    if (!servers || servers.length === 0) {
        serverListBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #666;">No servers configured</td>
            </tr>
        `;
        return;
    }

    serverListBody.innerHTML = servers.map(server => `
        <tr>
            <td>${server.name}</td>
            <td>${server.ip}</td>
            <td>
                <span class="status-indicator ${server.status === 'online' ? 'status-online' : 'status-offline'}"></span>
                ${server.status}
            </td>
            <td>${server.lastCheck || 'Never'}</td>
            <td>
                <button class="btn btn-primary" onclick="checkServer('${server.id}')">Check</button>
                <button class="btn btn-danger" onclick="removeServer('${server.id}')">Remove</button>
            </td>
        </tr>
    `).join('');
}

// Update service list
function updateServiceList(services) {
    const serviceListBody = document.getElementById('serviceList');

    if (!services || services.length === 0) {
        serviceListBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #666;">No services configured</td>
            </tr>
        `;
        return;
    }

    serviceListBody.innerHTML = services.map(service => `
        <tr>
            <td>${service.name}</td>
            <td>${service.server}</td>
            <td>${service.type}</td>
            <td>
                <span class="status-indicator ${service.status === 'running' ? 'status-online' : 'status-offline'}"></span>
                ${service.status}
            </td>
            <td>
                <button class="btn btn-primary" onclick="checkService('${service.id}')">Check</button>
                <button class="btn btn-danger" onclick="removeService('${service.id}')">Remove</button>
            </td>
        </tr>
    `).join('');
}

// Update alert list
function updateAlertList(alerts) {
    const alertListBody = document.getElementById('alertList');

    if (!alerts || alerts.length === 0) {
        alertListBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #666;">No alert rules configured</td>
            </tr>
        `;
        return;
    }

    alertListBody.innerHTML = alerts.map(alert => `
        <tr>
            <td>${alert.name}</td>
            <td>${alert.condition}</td>
            <td>${alert.threshold}</td>
            <td>
                <span class="status-indicator ${alert.enabled ? 'status-online' : 'status-offline'}"></span>
                ${alert.enabled ? 'Enabled' : 'Disabled'}
            </td>
            <td>
                <button class="btn btn-primary" onclick="toggleAlert('${alert.id}')">${alert.enabled ? 'Disable' : 'Enable'}</button>
                <button class="btn btn-danger" onclick="removeAlert('${alert.id}')">Remove</button>
            </td>
        </tr>
    `).join('');
}

// Server management functions
function checkServer(serverId) {
    sendToNode({
        type: 'checkServer',
        serverId: serverId
    });
}

function removeServer(serverId) {
    if (confirm('Are you sure you want to remove this server?')) {
        sendToNode({
            type: 'removeServer',
            serverId: serverId
        });
    }
}

// Service management functions
function checkService(serviceId) {
    sendToNode({
        type: 'checkService',
        serviceId: serviceId
    });
}

function removeService(serviceId) {
    if (confirm('Are you sure you want to remove this service?')) {
        sendToNode({
            type: 'removeService',
            serviceId: serviceId
        });
    }
}

// Alert management functions
function toggleAlert(alertId) {
    sendToNode({
        type: 'toggleAlert',
        alertId: alertId
    });
}

function removeAlert(alertId) {
    if (confirm('Are you sure you want to remove this alert rule?')) {
        sendToNode({
            type: 'removeAlert',
            alertId: alertId
        });
    }
}

// Periodic status updates
setInterval(function () {
    if (socket && socket.connected) {
        sendToNode({
            type: 'ping',
            message: 'Periodic ping'
        });
    }
}, 30000); // Every 30 seconds

// Header actions functionality
function initializeHeaderActions() {
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    changePasswordBtn.addEventListener('click', showChangePasswordDialog);

    // Header logout button
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    headerLogoutBtn.addEventListener('click', function () {
        // Clear stored data
        localStorage.removeItem('watchcat_token');
        localStorage.removeItem('watchcat_user');

        // Disconnect socket
        if (socket) {
            socket.disconnect();
        }

        // Redirect to login
        window.location.href = '/login.html';
    });
}

function showChangePasswordDialog() {
    const currentPassword = prompt('Please enter your current password:');
    if (!currentPassword) return;

    const newPassword = prompt('Please enter your new password (at least 6 characters):');
    if (!newPassword) return;

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long');
        return;
    }

    const confirmPassword = prompt('Please confirm your new password:');
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }

    changePassword(currentPassword, newPassword);
}

async function changePassword(currentPassword, newPassword) {
    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch('/api/users/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Password changed successfully!');
        } else {
            alert(result.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Change password error:', error);
        alert('Network error. Please try again.');
    }
} 