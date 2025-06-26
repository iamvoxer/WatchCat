const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');
const net = require('net');
const http = require('http');
const https = require('https');
const url = require('url');

/**
 * Watch Engine Class
 */
class WatchEngine {
    constructor() {
        // Load template configuration
        this.templates = this.loadTemplates();
    }

    /**
     * Load monitoring template configuration
     */
    loadTemplates() {
        try {
            const templatesPath = path.join(__dirname, 'watch.json');
            const data = fs.readFileSync(templatesPath, 'utf8');
            const config = JSON.parse(data);
            return config.templates || [];
        } catch (error) {
            console.error('Failed to load monitoring templates:', error);
            return [];
        }
    }

    /**
     * Get all templates
     */
    getAllTemplates() {
        return this.templates;
    }

    /**
     * Get template by ID
     */
    getTemplate(templateId) {
        return this.templates.find(t => t.id === templateId);
    }

    /**
     * Execute monitoring task
     */
    async executeMonitor(templateId, variables) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }

        // Validate required variables
        this.validateVariables(template, variables);

        // Execute corresponding monitoring logic based on template type
        if (template.type === 'local') {
            return await this.executeLocalMonitor(templateId, variables);
        } else if (template.type === 'remote') {
            return await this.executeRemoteMonitor(templateId, variables);
        } else {
            throw new Error(`Unsupported template type: ${template.type}`);
        }
    }

    /**
     * Validate variables
     */
    validateVariables(template, variables) {
        const requiredVars = template.variables.filter(v => v.required);
        for (const reqVar of requiredVars) {
            if (!variables[reqVar.name]) {
                throw new Error(`Missing required variable: ${reqVar.name}`);
            }
        }
    }

    /**
     * Execute local monitoring
     */
    async executeLocalMonitor(templateId, variables) {
        switch (templateId) {
            case 'ping':
                return await this.executePing(variables);
            case 'telnet':
                return await this.executeTelnet(variables);
            case 'httpget':
                return await this.executeHttpGet(variables);
            default:
                throw new Error(`Unsupported local monitoring type: ${templateId}`);
        }
    }

    /**
     * Execute remote monitoring
     */
    async executeRemoteMonitor(templateId, variables) {
        switch (templateId) {
            case 'server_status':
                return await this.executeServerStatus(variables);
            case 'application_status':
                return await this.executeApplicationStatus(variables);
            default:
                throw new Error(`Unsupported remote monitoring type: ${templateId}`);
        }
    }

    /**
     * Execute Ping monitoring
     */
    async executePing(variables) {
        return new Promise((resolve) => {
            const isWindows = process.platform === 'win32';
            const pingCommand = isWindows ? 'ping' : 'ping';
            const pingArgs = isWindows ? ['-n', '1', variables.ip] : ['-c', '1', variables.ip];

            const pingProcess = spawn(pingCommand, pingArgs);
            let isReachable = false;

            pingProcess.on('close', (code) => {
                isReachable = code === 0;
                resolve({
                    success: true,
                    data: {
                        isReachable: isReachable
                    },
                    timestamp: new Date().toISOString()
                });
            });

            pingProcess.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    data: {
                        isReachable: false
                    },
                    timestamp: new Date().toISOString()
                });
            });
        });
    }

    /**
     * Execute Telnet monitoring
     */
    async executeTelnet(variables) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 5000; // 5 seconds timeout

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                socket.destroy();
                resolve({
                    success: true,
                    data: {
                        isConnectable: true
                    },
                    timestamp: new Date().toISOString()
                });
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve({
                    success: true,
                    data: {
                        isConnectable: false
                    },
                    timestamp: new Date().toISOString()
                });
            });

            socket.on('error', (error) => {
                socket.destroy();
                resolve({
                    success: true,
                    data: {
                        isConnectable: false
                    },
                    timestamp: new Date().toISOString()
                });
            });

            socket.connect(variables.port, variables.ip);
        });
    }

    /**
     * Execute HTTP GET monitoring
     */
    async executeHttpGet(variables) {
        return new Promise((resolve) => {
            const parsedUrl = url.parse(variables.url);
            const isHttps = parsedUrl.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.path || '/',
                method: 'GET',
                timeout: 10000 // 10 seconds timeout
            };

            const req = httpModule.request(options, (res) => {
                const isSuccess = res.statusCode === 200;
                resolve({
                    success: true,
                    data: {
                        isSuccess: isSuccess,
                        statusCode: res.statusCode
                    },
                    timestamp: new Date().toISOString()
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message,
                    data: {
                        isSuccess: false
                    },
                    timestamp: new Date().toISOString()
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'Request timeout',
                    data: {
                        isSuccess: false
                    },
                    timestamp: new Date().toISOString()
                });
            });

            req.end();
        });
    }

    /**
 * Execute server status monitoring
 */
    async executeServerStatus(variables) {
        return new Promise((resolve) => {
            const conn = new Client();

            conn.on('ready', () => {
                console.log('SSH connection established');

                // Execute system status check commands
                const commands = [
                    // Disk usage
                    "df -h / | awk 'NR==2 {print $2,$3,$4,$5}'",
                    // Memory usage
                    "free -m | awk 'NR==2{printf \"%.0f %.0f %.2f\", $2,$7,$7*100/$2 }'",
                    // CPU usage
                    "top -bn1 | grep load | awk '{printf \"%.2f\", $(NF-2)}'"
                ];

                this.executeSSHCommands(conn, commands)
                    .then(results => {
                        conn.end();

                        // Parse results
                        const diskInfo = results[0].split(' ');
                        const memoryInfo = results[1].split(' ');
                        const cpuUsage = parseFloat(results[2]) || 0;

                        // Parse disk information
                        const totalDisk = this.parseSize(diskInfo[0]);
                        const usedDisk = this.parseSize(diskInfo[1]);
                        const freeDisk = this.parseSize(diskInfo[2]);

                        // Parse memory information
                        const totalMemory = parseFloat(memoryInfo[0]) / 1024; // Convert to GB
                        const freeMemory = parseFloat(memoryInfo[1]) / 1024; // Convert to GB

                        resolve({
                            success: true,
                            data: {
                                diskFreeSize: freeDisk,
                                diskFreeRatio: freeDisk / totalDisk,
                                memoryFreeSize: freeMemory,
                                memoryFreeRatio: freeMemory / totalMemory,
                                cpuUsage: cpuUsage
                            },
                            timestamp: new Date().toISOString()
                        });
                    })
                    .catch(error => {
                        conn.end();
                        resolve({
                            success: false,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    });
            });

            conn.on('error', (error) => {
                resolve({
                    success: false,
                    error: `SSH connection failed: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            });

            conn.connect({
                host: variables.ip,
                port: variables.ssh_port,
                username: variables.username,
                password: variables.password
            });
        });
    }

    /**
     * Execute application status monitoring
     */
    async executeApplicationStatus(variables) {
        return new Promise((resolve) => {
            const conn = new Client();

            conn.on('ready', () => {
                console.log('SSH connection established');

                // Build check commands
                const commands = [
                    // Check if process is alive
                    `pgrep -f "${variables.process_identifier}" | wc -l`,
                    // Get process PID
                    `pgrep -f "${variables.process_identifier}" | head -1`,
                    // Get process CPU and memory usage (requires PID)
                ];

                this.executeSSHCommands(conn, commands)
                    .then(async results => {
                        const processCount = parseInt(results[0]);
                        const isAlive = processCount > 0;
                        const pid = results[1].trim();

                        let cpuUsage = 0;
                        let memoryUsage = 0;
                        let diskUsage = 0;

                        if (isAlive && pid) {
                            // Get process resource usage
                            const resourceCommands = [
                                `ps -p ${pid} -o %cpu --no-headers`,
                                `ps -p ${pid} -o rss --no-headers`, // Memory usage (KB)
                            ];

                            // If directories are specified, calculate disk usage
                            if (variables.app_directories && variables.app_directories.length > 0) {
                                const dirs = variables.app_directories.join(' ');
                                resourceCommands.push(`du -sm ${dirs} 2>/dev/null | awk '{sum+=$1} END {print sum}'`);
                            }

                            try {
                                const resourceResults = await this.executeSSHCommands(conn, resourceCommands);
                                cpuUsage = parseFloat(resourceResults[0]) || 0;
                                memoryUsage = parseFloat(resourceResults[1]) / 1024 || 0; // Convert to MB
                                if (resourceResults[2]) {
                                    diskUsage = parseFloat(resourceResults[2]) || 0;
                                }
                            } catch (error) {
                                console.log('Failed to get resource usage:', error.message);
                            }
                        }

                        conn.end();
                        resolve({
                            success: true,
                            data: {
                                isAlive: isAlive,
                                diskUsage: diskUsage,
                                memoryUsage: memoryUsage,
                                cpuUsage: cpuUsage
                            },
                            timestamp: new Date().toISOString()
                        });
                    })
                    .catch(error => {
                        conn.end();
                        resolve({
                            success: false,
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                    });
            });

            conn.on('error', (error) => {
                resolve({
                    success: false,
                    error: `SSH connection failed: ${error.message}`,
                    timestamp: new Date().toISOString()
                });
            });

            conn.connect({
                host: variables.ip,
                port: variables.ssh_port,
                username: variables.username,
                password: variables.password
            });
        });
    }

    /**
     * Execute SSH command list
     */
    executeSSHCommands(conn, commands) {
        return new Promise((resolve, reject) => {
            let currentIndex = 0;
            const results = [];

            const executeNext = () => {
                if (currentIndex >= commands.length) {
                    resolve(results);
                    return;
                }

                const command = commands[currentIndex];
                conn.exec(command, (err, stream) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    let output = '';
                    let errorOutput = '';

                    stream.on('close', (code, signal) => {
                        if (code !== 0) {
                            reject(new Error(`Command execution failed: ${command}, error: ${errorOutput}`));
                        } else {
                            results.push(output.trim());
                            currentIndex++;
                            executeNext();
                        }
                    }).on('data', (data) => {
                        output += data;
                    }).stderr.on('data', (data) => {
                        errorOutput += data;
                    });
                });
            };

            executeNext();
        });
    }

    /**
     * Parse size string (e.g. 1.5G, 512M) to GB value
     */
    parseSize(sizeStr) {
        const size = parseFloat(sizeStr);
        const unit = sizeStr.replace(/[0-9.]/g, '').toUpperCase();

        switch (unit) {
            case 'G':
            case 'GB':
                return size;
            case 'M':
            case 'MB':
                return size / 1024;
            case 'K':
            case 'KB':
                return size / (1024 * 1024);
            case 'T':
            case 'TB':
                return size * 1024;
            default:
                return size / (1024 * 1024 * 1024); // Assume bytes
        }
    }
}

module.exports = WatchEngine; 