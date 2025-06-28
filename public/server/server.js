// Server Management Module
let servers = {};

// Simple notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transition: all 0.3s ease;
        transform: translateX(100%);
        opacity: 0;
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#212529';
            break;
        default:
            notification.style.backgroundColor = '#17a2b8';
    }

    // Add to document
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);

    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize server management when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const addServerBtn = document.getElementById('addServerBtn');
    if (addServerBtn) {
        addServerBtn.addEventListener('click', showServerSidebar);
    }

    // Initialize sidebar event listeners
    initializeServerSidebar();
});

// Load servers from backend
async function loadServers() {
    const container = document.getElementById('serverContainer');
    container.innerHTML = '<div class="loading-message">Loading servers...</div>';

    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch('/api/servers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            servers = data.servers;
            renderServers(data.servers);
        } else {
            container.innerHTML = `<div class="no-data-message">❌ Error loading servers: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Error loading servers:', error);
        container.innerHTML = `<div class="no-data-message">❌ Error loading servers: ${error.message}</div>`;
    }
}

// Render servers in the UI
function renderServers(serversData) {
    const container = document.getElementById('serverContainer');

    if (!serversData || Object.keys(serversData).length === 0) {
        container.innerHTML = '<div class="no-data-message">No servers configured</div>';
        return;
    }

    const serversHtml = Object.entries(serversData).map(([serverId, server]) =>
        renderServerCard(serverId, server)
    ).join('');

    container.innerHTML = serversHtml;
}

// Render individual server card
function renderServerCard(serverId, server) {
    const watchCount = server.watchlist ? server.watchlist.length : 0;
    const alarmCount = server.watchlist ?
        server.watchlist.reduce((acc, watch) => acc + (watch.watch.alarmlist ? watch.watch.alarmlist.length : 0), 0) : 0;

    return `
        <div class="server-card" data-server-id="${serverId}">
            <div class="server-card-header" onclick="toggleServerCard('${serverId}')">
                <div class="server-info">
                    <span class="expand-icon">▶</span>
                    <span class="server-status offline"></span>
                    <strong>${server.name}</strong>
                    <span style="color: #666;">${server.ip}</span>
                    <span style="color: #999; font-size: 0.9rem;">${watchCount} tasks, ${alarmCount} alarms</span>
                </div>
                <div class="server-actions">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editServer('${serverId}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteServer('${serverId}')">
                        Delete
                    </button>
                </div>
            </div>
            <div class="server-content" id="server-content-${serverId}">
                <div class="server-details">
                    <div class="detail-item">
                        <div class="detail-label">Server Name</div>
                        <div class="detail-value">${server.name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Description</div>
                        <div class="detail-value">${server.desc || 'No description'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">IP Address</div>
                        <div class="detail-value">${server.ip}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Username</div>
                        <div class="detail-value">${server.username}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Password</div>
                        <div class="detail-value">${server.password}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Last Updated</div>
                        <div class="detail-value">${server.updatedAt ? new Date(server.updatedAt).toLocaleString() : 'Never'}</div>
                    </div>
                </div>
                
                <div class="watch-section">
                    <div class="watch-header">
                        <h4>Watch Tasks (${watchCount})</h4>
                        <button class="btn btn-sm btn-primary" onclick="addWatchTask('${serverId}')">
                            + Add Watch Task
                        </button>
                    </div>
                    <div class="watch-list">
                        ${renderWatchList(serverId, server.watchlist || [])}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render watch list for a server
function renderWatchList(serverId, watchlist) {
    if (!watchlist || watchlist.length === 0) {
        return '<div class="no-data-message">No watch tasks configured</div>';
    }

    return watchlist.map(watch => renderWatchItem(serverId, watch)).join('');
}

// Render individual watch item
function renderWatchItem(serverId, watch) {
    const alarmCount = watch.watch.alarmlist ? watch.watch.alarmlist.length : 0;

    return `
        <div class="watch-item" data-watch-id="${watch.id}">
            <div class="watch-header-item" onclick="toggleWatchDetails('${serverId}', '${watch.id}')">
                <div class="watch-info">
                    <span class="expand-icon">▶</span>
                    <span class="watch-toggle ${watch.enable ? 'enabled' : 'disabled'}"></span>
                    <strong>${watch.name}</strong>
                    <span style="color: #666;">${watch.period}</span>
                    <span style="color: #999; font-size: 0.9rem;">${alarmCount} alarms</span>
                </div>
                <div class="server-actions">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editWatchTask('${serverId}', '${watch.id}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteWatchTask('${serverId}', '${watch.id}')">
                        Delete
                    </button>
                </div>
            </div>
            <div class="watch-details" id="watch-details-${serverId}-${watch.id}">
                <div class="server-details">
                    <div class="detail-item">
                        <div class="detail-label">Template</div>
                        <div class="detail-value">${watch.watch.template || 'None'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Status</div>
                        <div class="detail-value">${watch.enable ? 'Enabled' : 'Disabled'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Period</div>
                        <div class="detail-value">${watch.period}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Data</div>
                        <div class="detail-value"><pre>${JSON.stringify(watch.watch.data, null, 2)}</pre></div>
                    </div>
                </div>
                
                <div class="alarm-list">
                    <div class="watch-header">
                        <h5>Alarms (${alarmCount})</h5>
                        <button class="btn btn-sm btn-primary" onclick="addAlarm('${serverId}', '${watch.id}')">
                            + Add Alarm
                        </button>
                    </div>
                    ${renderAlarmList(serverId, watch.id, watch.watch.alarmlist || [])}
                </div>
            </div>
        </div>
    `;
}

// Render alarm list
function renderAlarmList(serverId, watchId, alarmlist) {
    if (!alarmlist || alarmlist.length === 0) {
        return '<div class="no-data-message">No alarms configured</div>';
    }

    return alarmlist.map(alarm => `
        <div class="alarm-item">
            <div>
                <strong>${alarm.name}</strong>
                <br>
                <small style="color: #666;">Template: ${alarm.template}</small>
                <br>
                <small style="color: #999;">${JSON.stringify(alarm.data)}</small>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteAlarm('${serverId}', '${watchId}', '${alarm.id}')">
                Delete
            </button>
        </div>
    `).join('');
}

// Toggle server card expansion
function toggleServerCard(serverId) {
    const content = document.getElementById(`server-content-${serverId}`);
    const icon = content.previousElementSibling.querySelector('.expand-icon');

    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.textContent = '▶';
        icon.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        icon.textContent = '▼';
        icon.classList.add('expanded');
    }
}

// Toggle watch details expansion
function toggleWatchDetails(serverId, watchId) {
    const details = document.getElementById(`watch-details-${serverId}-${watchId}`);
    const icon = details.previousElementSibling.querySelector('.expand-icon');

    if (details.classList.contains('expanded')) {
        details.classList.remove('expanded');
        icon.textContent = '▶';
        icon.classList.remove('expanded');
    } else {
        details.classList.add('expanded');
        icon.textContent = '▼';
        icon.classList.add('expanded');
    }
}

// Initialize server sidebar
function initializeServerSidebar() {
    const sidebar = document.getElementById('serverSidebar');
    const overlay = document.getElementById('serverSidebarOverlay');
    const closeBtn = document.getElementById('serverSidebarClose');
    const cancelBtn = document.getElementById('serverFormCancel');
    const form = document.getElementById('serverForm');

    if (!sidebar || !overlay || !closeBtn || !cancelBtn || !form) return;

    // Close sidebar events
    closeBtn.addEventListener('click', hideServerSidebar);
    cancelBtn.addEventListener('click', hideServerSidebar);
    overlay.addEventListener('click', hideServerSidebar);

    // Form submit event
    form.addEventListener('submit', handleServerFormSubmit);
}

// Show server sidebar for adding
function showServerSidebar() {
    const sidebar = document.getElementById('serverSidebar');
    const overlay = document.getElementById('serverSidebarOverlay');
    const title = document.getElementById('serverSidebarTitle');
    const submitText = document.getElementById('serverFormSubmitText');
    const form = document.getElementById('serverForm');

    if (!sidebar || !overlay || !title || !submitText || !form) return;

    // Reset form and set add mode
    form.reset();
    form.removeAttribute('data-server-id');
    document.getElementById('serverUsername').value = 'root'; // Set default username

    title.textContent = 'Add Server';
    submitText.textContent = 'Add Server';

    // Show sidebar
    sidebar.classList.add('active');
    overlay.classList.add('active');

    // Focus first input
    setTimeout(() => {
        document.getElementById('serverName').focus();
    }, 300);
}

// Show server sidebar for editing
function showEditServerSidebar(serverId) {
    const server = servers[serverId];
    if (!server) return;

    const sidebar = document.getElementById('serverSidebar');
    const overlay = document.getElementById('serverSidebarOverlay');
    const title = document.getElementById('serverSidebarTitle');
    const submitText = document.getElementById('serverFormSubmitText');
    const form = document.getElementById('serverForm');

    if (!sidebar || !overlay || !title || !submitText || !form) return;

    // Fill form with server data
    document.getElementById('serverName').value = server.name || '';
    document.getElementById('serverIP').value = server.ip || '';
    document.getElementById('serverDesc').value = server.desc || '';
    document.getElementById('serverUsername').value = server.username || 'root';
    document.getElementById('serverPassword').value = ''; // Don't show password
    document.getElementById('serverPassword').placeholder = 'Leave empty to keep current password';

    // Set edit mode
    form.setAttribute('data-server-id', serverId);
    title.textContent = 'Edit Server';
    submitText.textContent = 'Update Server';

    // Show sidebar
    sidebar.classList.add('active');
    overlay.classList.add('active');

    // Focus first input
    setTimeout(() => {
        document.getElementById('serverName').focus();
    }, 300);
}

// Hide server sidebar
function hideServerSidebar() {
    const sidebar = document.getElementById('serverSidebar');
    const overlay = document.getElementById('serverSidebarOverlay');

    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// Handle server form submit
async function handleServerFormSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = document.getElementById('serverFormSubmit');
    const serverId = form.getAttribute('data-server-id');
    const isEdit = !!serverId;

    // Get form data
    const formData = new FormData(form);
    const serverData = {
        name: formData.get('name').trim(),
        ip: formData.get('ip').trim(),
        desc: formData.get('desc').trim(),
        username: formData.get('username').trim() || 'root',
        password: formData.get('password').trim()
    };

    // Validate required fields
    if (!serverData.name || !serverData.ip) {
        showWarning('Server name and IP address are required');
        return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    const originalText = submitBtn.querySelector('#serverFormSubmitText').textContent;
    submitBtn.querySelector('#serverFormSubmitText').textContent = isEdit ? 'Updating...' : 'Adding...';

    try {
        if (isEdit) {
            // Don't send empty password for updates
            if (!serverData.password) {
                delete serverData.password;
            }
            await updateServer(serverId, serverData);
        } else {
            await createServer(serverData);
        }

        hideServerSidebar();
    } catch (error) {
        console.error('Error saving server:', error);
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.querySelector('#serverFormSubmitText').textContent = originalText;
    }
}

// Create new server
async function createServer(serverData) {
    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch('/api/servers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(serverData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Server created successfully', 'success');
            loadServers(); // Reload server list
        } else {
            showNotification(`Error creating server: ${data.message}`, 'error');
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error creating server:', error);
        if (!error.message.includes('Error creating server:')) {
            showNotification('Error creating server', 'error');
        }
        throw error;
    }
}

// Edit server
function editServer(serverId) {
    showEditServerSidebar(serverId);
}

// Update server
async function updateServer(serverId, serverData) {
    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch(`/api/servers/${serverId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(serverData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Server updated successfully', 'success');
            loadServers(); // Reload server list
        } else {
            showNotification(`Error updating server: ${data.message}`, 'error');
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error updating server:', error);
        if (!error.message.includes('Error updating server:')) {
            showNotification('Error updating server', 'error');
        }
        throw error;
    }
}

// Delete server
async function deleteServer(serverId) {
    const confirmed = await showConfirm('Are you sure you want to delete this server? This will also delete all watch tasks and alarms.', 'Delete Server');
    if (!confirmed) {
        return;
    }

    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch(`/api/servers/${serverId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Server deleted successfully');
            loadServers(); // Reload server list
        } else {
            showError(`Error deleting server: ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting server:', error);
        showError('Error deleting server');
    }
}

// Add watch task
async function addWatchTask(serverId) {
    const name = prompt('Enter watch task name:');
    if (!name) return;

    const period = prompt('Enter cron period (e.g., "0 */5 * * *" for every 5 minutes):');
    if (!period) return;

    const template = prompt('Enter template name:') || '';
    const enable = await showConfirm('Enable this watch task?', 'Enable Watch Task');

    const watchData = {
        name: name,
        period: period,
        template: template,
        enable: enable,
        data: {}
    };

    createWatchTask(serverId, watchData);
}

// Create watch task
async function createWatchTask(serverId, watchData) {
    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch(`/api/servers/${serverId}/watch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(watchData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Watch task created successfully');
            loadServers(); // Reload server list
        } else {
            showError(`Error creating watch task: ${data.message}`);
        }
    } catch (error) {
        console.error('Error creating watch task:', error);
        showError('Error creating watch task');
    }
}

// Edit watch task
async function editWatchTask(serverId, watchId) {
    const server = servers[serverId];
    if (!server) return;

    const watch = server.watchlist.find(w => w.id === watchId);
    if (!watch) return;

    const name = prompt('Enter watch task name:', watch.name);
    if (name === null) return;

    const period = prompt('Enter cron period:', watch.period);
    if (period === null) return;

    const template = prompt('Enter template name:', watch.watch.template || '');
    if (template === null) return;

    const enable = await showConfirm('Enable this watch task?', 'Enable Watch Task');

    const updateData = {
        name: name,
        period: period,
        template: template,
        enable: enable,
        data: watch.watch.data
    };

    updateWatchTask(serverId, watchId, updateData);
}

// Update watch task
async function updateWatchTask(serverId, watchId, watchData) {
    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch(`/api/servers/${serverId}/watch/${watchId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(watchData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Watch task updated successfully');
            loadServers(); // Reload server list
        } else {
            showError(`Error updating watch task: ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating watch task:', error);
        showError('Error updating watch task');
    }
}

// Delete watch task
async function deleteWatchTask(serverId, watchId) {
    const confirmed = await showConfirm('Are you sure you want to delete this watch task? This will also delete all associated alarms.', 'Delete Watch Task');
    if (!confirmed) {
        return;
    }

    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch(`/api/servers/${serverId}/watch/${watchId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Watch task deleted successfully');
            loadServers(); // Reload server list
        } else {
            showError(`Error deleting watch task: ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting watch task:', error);
        showError('Error deleting watch task');
    }
}

// Add alarm
function addAlarm(serverId, watchId) {
    const name = prompt('Enter alarm name:');
    if (!name) return;

    const template = prompt('Enter alarm template (e.g., "cpu_threshold"):');
    if (!template) return;

    const dataStr = prompt('Enter alarm data as JSON (e.g., {"maxCpu": 80}):') || '{}';

    try {
        const data = JSON.parse(dataStr);

        const alarmData = {
            name: name,
            template: template,
            data: data
        };

        createAlarm(serverId, watchId, alarmData);
    } catch (error) {
        showError('Invalid JSON data format');
    }
}

// Create alarm
async function createAlarm(serverId, watchId, alarmData) {
    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch(`/api/servers/${serverId}/watch/${watchId}/alarm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(alarmData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Alarm created successfully');
            loadServers(); // Reload server list
        } else {
            showError(`Error creating alarm: ${data.message}`);
        }
    } catch (error) {
        console.error('Error creating alarm:', error);
        showError('Error creating alarm');
    }
}

// Delete alarm
async function deleteAlarm(serverId, watchId, alarmId) {
    const confirmed = await showConfirm('Are you sure you want to delete this alarm?', 'Delete Alarm');
    if (!confirmed) {
        return;
    }

    try {
        const token = localStorage.getItem('watchcat_token');
        const response = await fetch(`/api/servers/${serverId}/watch/${watchId}/alarm/${alarmId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Alarm deleted successfully');
            loadServers(); // Reload server list
        } else {
            showError(`Error deleting alarm: ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting alarm:', error);
        showError('Error deleting alarm');
    }
} 