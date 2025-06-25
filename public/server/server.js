// Server Management Module
let servers = {};

// Initialize server management when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    const addServerBtn = document.getElementById('addServerBtn');
    if (addServerBtn) {
        addServerBtn.addEventListener('click', showAddServerDialog);
    }
});

// Load servers from API
async function loadServers() {
    const container = document.getElementById('serverContainer');
    container.innerHTML = '<div class="loading-message">Loading servers...</div>';

    // 模拟延迟加载效果
    setTimeout(() => {
        // 创建假数据
        const mockServers = {
            "server-001": {
                name: "生产服务器-Web01",
                desc: "主要的Web应用服务器，运行Nginx和Node.js应用",
                ip: "192.168.1.100",
                username: "root",
                password: "******",
                createdAt: "2024-01-15T08:00:00.000Z",
                updatedAt: "2024-06-20T14:30:00.000Z",
                watchlist: [
                    {
                        id: "watch-001",
                        name: "CPU使用率监控",
                        enable: true,
                        period: "0 */2 * * *",
                        watch: {
                            template: "cpu_monitor",
                            data: {
                                threshold: 80,
                                interval: 60
                            },
                            alarmlist: [
                                {
                                    id: "alarm-001",
                                    name: "CPU高负载告警",
                                    template: "cpu_threshold",
                                    data: {
                                        maxCpu: 85,
                                        duration: 300
                                    },
                                    createdAt: "2024-01-15T08:30:00.000Z"
                                },
                                {
                                    id: "alarm-002",
                                    name: "CPU极高负载告警",
                                    template: "cpu_critical",
                                    data: {
                                        maxCpu: 95,
                                        duration: 60
                                    },
                                    createdAt: "2024-01-15T08:35:00.000Z"
                                }
                            ]
                        },
                        createdAt: "2024-01-15T08:15:00.000Z",
                        updatedAt: "2024-06-20T10:00:00.000Z"
                    },
                    {
                        id: "watch-002",
                        name: "内存使用监控",
                        enable: true,
                        period: "0 */5 * * *",
                        watch: {
                            template: "memory_monitor",
                            data: {
                                threshold: 90,
                                interval: 300
                            },
                            alarmlist: [
                                {
                                    id: "alarm-003",
                                    name: "内存不足告警",
                                    template: "memory_threshold",
                                    data: {
                                        maxMemory: 90,
                                        duration: 600
                                    },
                                    createdAt: "2024-01-20T09:00:00.000Z"
                                }
                            ]
                        },
                        createdAt: "2024-01-20T08:45:00.000Z",
                        updatedAt: "2024-06-15T16:20:00.000Z"
                    },
                    {
                        id: "watch-003",
                        name: "磁盘空间监控",
                        enable: false,
                        period: "0 0 * * *",
                        watch: {
                            template: "disk_monitor",
                            data: {
                                path: "/",
                                threshold: 85
                            },
                            alarmlist: []
                        },
                        createdAt: "2024-02-01T10:00:00.000Z",
                        updatedAt: "2024-06-10T11:30:00.000Z"
                    }
                ]
            },
            "server-002": {
                name: "数据库服务器-DB01",
                desc: "MySQL主数据库服务器",
                ip: "192.168.1.101",
                username: "admin",
                password: "******",
                createdAt: "2024-01-16T09:00:00.000Z",
                updatedAt: "2024-06-25T08:45:00.000Z",
                watchlist: [
                    {
                        id: "watch-004",
                        name: "MySQL服务监控",
                        enable: true,
                        period: "0 */1 * * *",
                        watch: {
                            template: "mysql_monitor",
                            data: {
                                port: 3306,
                                database: "production"
                            },
                            alarmlist: [
                                {
                                    id: "alarm-004",
                                    name: "MySQL连接失败告警",
                                    template: "mysql_connection",
                                    data: {
                                        timeout: 30,
                                        retries: 3
                                    },
                                    createdAt: "2024-01-16T09:30:00.000Z"
                                }
                            ]
                        },
                        createdAt: "2024-01-16T09:15:00.000Z",
                        updatedAt: "2024-06-25T08:45:00.000Z"
                    },
                    {
                        id: "watch-005",
                        name: "数据库性能监控",
                        enable: true,
                        period: "0 */10 * * *",
                        watch: {
                            template: "mysql_performance",
                            data: {
                                slowQueryThreshold: 1000,
                                connectionThreshold: 100
                            },
                            alarmlist: [
                                {
                                    id: "alarm-005",
                                    name: "慢查询告警",
                                    template: "slow_query",
                                    data: {
                                        threshold: 1000,
                                        count: 10
                                    },
                                    createdAt: "2024-02-05T14:20:00.000Z"
                                }
                            ]
                        },
                        createdAt: "2024-02-05T14:00:00.000Z",
                        updatedAt: "2024-06-20T13:15:00.000Z"
                    }
                ]
            },
            "server-003": {
                name: "缓存服务器-Redis01",
                desc: "Redis缓存集群主节点",
                ip: "192.168.1.102",
                username: "ubuntu",
                password: "******",
                createdAt: "2024-02-01T10:30:00.000Z",
                updatedAt: "2024-06-18T15:20:00.000Z",
                watchlist: [
                    {
                        id: "watch-006",
                        name: "Redis服务监控",
                        enable: true,
                        period: "0 */2 * * *",
                        watch: {
                            template: "redis_monitor",
                            data: {
                                port: 6379,
                                auth: true
                            },
                            alarmlist: []
                        },
                        createdAt: "2024-02-01T11:00:00.000Z",
                        updatedAt: "2024-06-18T15:20:00.000Z"
                    }
                ]
            },
            "server-004": {
                name: "测试服务器-Test01",
                desc: "开发测试环境服务器",
                ip: "192.168.1.200",
                username: "developer",
                password: "******",
                createdAt: "2024-03-10T14:00:00.000Z",
                updatedAt: "2024-06-22T09:30:00.000Z",
                watchlist: []
            }
        };

        servers = mockServers;
        renderServers(mockServers);
    }, 800); // 模拟800ms的加载时间
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

// Show add server dialog
function showAddServerDialog() {
    const name = prompt('Enter server name:');
    if (!name) return;

    const ip = prompt('Enter server IP address:');
    if (!ip) return;

    const desc = prompt('Enter server description (optional):') || '';
    const username = prompt('Enter username (default: root):') || 'root';
    const password = prompt('Enter password:') || '';

    createServer({
        name: name,
        desc: desc,
        ip: ip,
        username: username,
        password: password
    });
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
            alert('Server created successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error creating server: ${data.message}`);
        }
    } catch (error) {
        console.error('Error creating server:', error);
        alert('Error creating server');
    }
}

// Edit server
function editServer(serverId) {
    const server = servers[serverId];
    if (!server) return;

    const name = prompt('Enter server name:', server.name);
    if (name === null) return;

    const ip = prompt('Enter server IP address:', server.ip);
    if (ip === null) return;

    const desc = prompt('Enter server description:', server.desc || '');
    if (desc === null) return;

    const username = prompt('Enter username:', server.username);
    if (username === null) return;

    const password = prompt('Enter new password (leave empty to keep current):');

    const updateData = {
        name: name,
        desc: desc,
        ip: ip,
        username: username
    };

    if (password && password.trim() !== '') {
        updateData.password = password;
    }

    updateServer(serverId, updateData);
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
            alert('Server updated successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error updating server: ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating server:', error);
        alert('Error updating server');
    }
}

// Delete server
async function deleteServer(serverId) {
    if (!confirm('Are you sure you want to delete this server? This will also delete all watch tasks and alarms.')) {
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
            alert('Server deleted successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error deleting server: ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting server:', error);
        alert('Error deleting server');
    }
}

// Add watch task
function addWatchTask(serverId) {
    const name = prompt('Enter watch task name:');
    if (!name) return;

    const period = prompt('Enter cron period (e.g., "0 */5 * * *" for every 5 minutes):');
    if (!period) return;

    const template = prompt('Enter template name:') || '';
    const enable = confirm('Enable this watch task?');

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
            alert('Watch task created successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error creating watch task: ${data.message}`);
        }
    } catch (error) {
        console.error('Error creating watch task:', error);
        alert('Error creating watch task');
    }
}

// Edit watch task
function editWatchTask(serverId, watchId) {
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

    const enable = confirm('Enable this watch task?');

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
            alert('Watch task updated successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error updating watch task: ${data.message}`);
        }
    } catch (error) {
        console.error('Error updating watch task:', error);
        alert('Error updating watch task');
    }
}

// Delete watch task
async function deleteWatchTask(serverId, watchId) {
    if (!confirm('Are you sure you want to delete this watch task? This will also delete all associated alarms.')) {
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
            alert('Watch task deleted successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error deleting watch task: ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting watch task:', error);
        alert('Error deleting watch task');
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
        alert('Invalid JSON data format');
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
            alert('Alarm created successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error creating alarm: ${data.message}`);
        }
    } catch (error) {
        console.error('Error creating alarm:', error);
        alert('Error creating alarm');
    }
}

// Delete alarm
async function deleteAlarm(serverId, watchId, alarmId) {
    if (!confirm('Are you sure you want to delete this alarm?')) {
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
            alert('Alarm deleted successfully');
            loadServers(); // Reload server list
        } else {
            alert(`Error deleting alarm: ${data.message}`);
        }
    } catch (error) {
        console.error('Error deleting alarm:', error);
        alert('Error deleting alarm');
    }
} 