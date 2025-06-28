const fs = require('fs');
const nodemailer = require('nodemailer');
const { authenticateToken, readJsonFile, writeJsonFile } = require('./user');

// Utility function to generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate email format
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate notifier data
function validateNotifierData(data) {
    const errors = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Notifier name is required');
    }

    if (!data.type) {
        data.type = 'email'; // Default to email
    }

    if (data.type !== 'email') {
        errors.push('Only email notifications are currently supported');
    }

    if (!data.emails || !Array.isArray(data.emails) || data.emails.length === 0) {
        errors.push('At least one email address is required');
    } else {
        // Validate each email
        for (const email of data.emails) {
            if (!validateEmail(email)) {
                errors.push(`Invalid email address: ${email}`);
            }
        }
    }

    if (!data.smtpHost || typeof data.smtpHost !== 'string' || data.smtpHost.trim().length === 0) {
        errors.push('SMTP host is required');
    }

    if (!data.smtpPort || isNaN(parseInt(data.smtpPort))) {
        errors.push('Valid SMTP port is required');
    }

    if (!data.smtpUser || typeof data.smtpUser !== 'string' || data.smtpUser.trim().length === 0) {
        errors.push('SMTP username is required');
    }

    if (!data.smtpPassword || typeof data.smtpPassword !== 'string' || data.smtpPassword.trim().length === 0) {
        errors.push('SMTP password is required');
    }

    return errors;
}

// Get all notifiers function
function getAllNotifiers() {
    try {
        const notifiers = readJsonFile('./data/notifiers.json') || [];

        // Remove sensitive information (passwords) from response
        const safeNotifiers = notifiers.map(notifier => {
            const { smtpPassword, ...safeNotifier } = notifier;
            return {
                ...safeNotifier,
                hasPassword: !!smtpPassword
            };
        });

        return {
            success: true,
            notifiers: safeNotifiers
        };
    } catch (error) {
        console.error('Get notifiers error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Get notifier by ID function
function getNotifierById(id) {
    try {
        const notifiers = readJsonFile('./data/notifiers.json') || [];
        const notifier = notifiers.find(n => n.id === id);

        if (!notifier) {
            return {
                success: false,
                message: 'Notifier not found'
            };
        }

        // Remove password from response
        const { smtpPassword, ...safeNotifier } = notifier;

        return {
            success: true,
            notifier: {
                ...safeNotifier,
                hasPassword: !!smtpPassword
            }
        };
    } catch (error) {
        console.error('Get notifier error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Create new notifier function
function createNotifier(data) {
    try {
        const validationErrors = validateNotifierData(data);
        if (validationErrors.length > 0) {
            return {
                success: false,
                message: validationErrors.join('; ')
            };
        }

        const notifiers = readJsonFile('./data/notifiers.json') || [];

        // Check if notifier with same name already exists
        const existingNotifier = notifiers.find(n => n.name === data.name);
        if (existingNotifier) {
            return {
                success: false,
                message: 'Notifier with this name already exists'
            };
        }

        // Create new notifier object
        const newNotifier = {
            id: generateId(),
            name: data.name.trim(),
            description: data.description?.trim() || '',
            type: data.type || 'email',
            emails: data.emails,
            smtpHost: data.smtpHost.trim(),
            smtpPort: parseInt(data.smtpPort),
            smtpUser: data.smtpUser.trim(),
            smtpPassword: data.smtpPassword,
            enabled: data.enabled !== false, // Default to true
            createdAt: new Date().toISOString()
        };

        // Add to notifiers array
        notifiers.push(newNotifier);

        // Save to file
        const saved = writeJsonFile('./data/notifiers.json', notifiers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving notifier data'
            };
        }

        // Return without password
        const { smtpPassword, ...safeNotifier } = newNotifier;

        return {
            success: true,
            message: 'Notifier created successfully',
            notifier: {
                ...safeNotifier,
                hasPassword: !!smtpPassword
            }
        };
    } catch (error) {
        console.error('Create notifier error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Update notifier function
function updateNotifier(id, data) {
    try {
        const validationErrors = validateNotifierData(data);
        if (validationErrors.length > 0) {
            return {
                success: false,
                message: validationErrors.join('; ')
            };
        }

        const notifiers = readJsonFile('./data/notifiers.json') || [];
        const notifierIndex = notifiers.findIndex(n => n.id === id);

        if (notifierIndex === -1) {
            return {
                success: false,
                message: 'Notifier not found'
            };
        }

        // Check if another notifier with same name exists
        const existingNotifier = notifiers.find(n => n.name === data.name && n.id !== id);
        if (existingNotifier) {
            return {
                success: false,
                message: 'Notifier with this name already exists'
            };
        }

        // Update notifier
        const existingNotifier2 = notifiers[notifierIndex];
        const updatedNotifier = {
            ...existingNotifier2,
            name: data.name.trim(),
            description: data.description?.trim() || '',
            type: data.type || 'email',
            emails: data.emails,
            smtpHost: data.smtpHost.trim(),
            smtpPort: parseInt(data.smtpPort),
            smtpUser: data.smtpUser.trim(),
            smtpPassword: data.smtpPassword,
            enabled: data.enabled !== false,
            updatedAt: new Date().toISOString()
        };

        notifiers[notifierIndex] = updatedNotifier;

        // Save to file
        const saved = writeJsonFile('./data/notifiers.json', notifiers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving notifier data'
            };
        }

        // Return without password
        const { smtpPassword, ...safeNotifier } = updatedNotifier;

        return {
            success: true,
            message: 'Notifier updated successfully',
            notifier: {
                ...safeNotifier,
                hasPassword: !!smtpPassword
            }
        };
    } catch (error) {
        console.error('Update notifier error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Delete notifier function
function deleteNotifier(id) {
    try {
        const notifiers = readJsonFile('./data/notifiers.json') || [];
        const notifierIndex = notifiers.findIndex(n => n.id === id);

        if (notifierIndex === -1) {
            return {
                success: false,
                message: 'Notifier not found'
            };
        }

        const deletedNotifier = notifiers[notifierIndex];

        // Remove notifier from array
        notifiers.splice(notifierIndex, 1);

        // Save to file
        const saved = writeJsonFile('./data/notifiers.json', notifiers);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving notifier data'
            };
        }

        return {
            success: true,
            message: `Notifier "${deletedNotifier.name}" deleted successfully`
        };
    } catch (error) {
        console.error('Delete notifier error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Test notifier function
async function testNotifier(id) {
    try {
        console.log('=== 开始测试通知器 ===');
        console.log('通知器ID:', id);

        const notifiers = readJsonFile('./data/notifiers.json') || [];
        console.log('已加载的通知器数量:', notifiers.length);

        const notifier = notifiers.find(n => n.id === id);

        if (!notifier) {
            console.log('错误: 通知器未找到');
            return {
                success: false,
                message: 'Notifier not found'
            };
        }

        console.log('找到通知器:', {
            id: notifier.id,
            name: notifier.name,
            smtpHost: notifier.smtpHost,
            smtpPort: notifier.smtpPort,
            smtpUser: notifier.smtpUser,
            hasPassword: !!notifier.smtpPassword,
            emails: notifier.emails,
            enabled: notifier.enabled
        });

        if (!notifier.enabled) {
            console.log('错误: 通知器已禁用');
            return {
                success: false,
                message: 'Notifier is disabled'
            };
        }

        // Create transporter
        const transporterConfig = {
            host: notifier.smtpHost,
            port: notifier.smtpPort,
            secure: notifier.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: notifier.smtpUser,
                pass: notifier.smtpPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        };

        console.log('SMTP传输器配置:', {
            host: transporterConfig.host,
            port: transporterConfig.port,
            secure: transporterConfig.secure,
            user: transporterConfig.auth.user,
            hasPassword: !!transporterConfig.auth.pass
        });

        const transporter = nodemailer.createTransport(transporterConfig);

        // Test email content
        const testMessage = {
            from: notifier.smtpUser,
            to: notifier.emails.join(', '),
            subject: 'WatchCat Notifier Test',
            text: `This is a test message from WatchCat notifier "${notifier.name}".

Configuration Details:
- Notifier: ${notifier.name}
- SMTP Server: ${notifier.smtpHost}:${notifier.smtpPort}
- Recipients: ${notifier.emails.join(', ')}
- Test Time: ${new Date().toISOString()}

If you received this message, your notifier is working correctly!`,
            html: `
                <h2>WatchCat Notifier Test</h2>
                <p>This is a test message from WatchCat notifier "<strong>${notifier.name}</strong>".</p>
                
                <h3>Configuration Details:</h3>
                <ul>
                    <li><strong>Notifier:</strong> ${notifier.name}</li>
                    <li><strong>SMTP Server:</strong> ${notifier.smtpHost}:${notifier.smtpPort}</li>
                    <li><strong>Recipients:</strong> ${notifier.emails.join(', ')}</li>
                    <li><strong>Test Time:</strong> ${new Date().toISOString()}</li>
                </ul>
                
                <p style="color: green;"><strong>✅ If you received this message, your notifier is working correctly!</strong></p>
            `
        };

        // Send test email
        console.log('准备发送测试邮件...');
        console.log('邮件配置:', {
            from: testMessage.from,
            to: testMessage.to,
            subject: testMessage.subject
        });

        const info = await transporter.sendMail(testMessage);

        console.log('邮件发送成功!');
        console.log('邮件ID:', info.messageId);
        console.log('服务器响应:', info.response);

        return {
            success: true,
            message: 'Test email sent successfully',
            details: {
                messageId: info.messageId,
                recipients: notifier.emails
            }
        };
    } catch (error) {
        console.error('=== 测试通知器失败 ===');
        console.error('错误类型:', error.name);
        console.error('错误信息:', error.message);
        console.error('错误代码:', error.code);
        console.error('完整错误:', error);

        return {
            success: false,
            message: `Test failed: ${error.message}`
        };
    }
}

// Send notification using notifier
async function sendNotification(notifierId, subject, message, htmlMessage = null) {
    try {
        const notifiers = readJsonFile('./data/notifiers.json') || [];
        const notifier = notifiers.find(n => n.id === notifierId);

        if (!notifier) {
            throw new Error('Notifier not found');
        }

        if (!notifier.enabled) {
            throw new Error('Notifier is disabled');
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: notifier.smtpHost,
            port: notifier.smtpPort,
            secure: notifier.smtpPort === 465,
            auth: {
                user: notifier.smtpUser,
                pass: notifier.smtpPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Send email
        const mailOptions = {
            from: notifier.smtpUser,
            to: notifier.emails.join(', '),
            subject: subject,
            text: message,
            html: htmlMessage || message
        };

        const info = await transporter.sendMail(mailOptions);

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        console.error('Send notification error:', error);
        throw error;
    }
}

// Setup notifier routes
function setupNotifierRoutes(app) {
    // Get all notifiers
    app.get('/api/notifiers', authenticateToken, (req, res) => {
        const result = getAllNotifiers();

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    });

    // Get notifier by ID
    app.get('/api/notifiers/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const result = getNotifierById(id);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json(result);
        }
    });

    // Create new notifier
    app.post('/api/notifiers', authenticateToken, (req, res) => {
        const result = createNotifier(req.body);

        if (result.success) {
            res.status(201).json(result);
        } else {
            const statusCode = result.message.includes('already exists') ? 409 : 400;
            res.status(statusCode).json(result);
        }
    });

    // Update notifier
    app.put('/api/notifiers/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const result = updateNotifier(id, req.body);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('not found') ? 404 :
                result.message.includes('already exists') ? 409 : 400;
            res.status(statusCode).json(result);
        }
    });

    // Delete notifier
    app.delete('/api/notifiers/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const result = deleteNotifier(id);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json(result);
        }
    });

    // Test notifier
    app.post('/api/notifiers/:id/test', authenticateToken, async (req, res) => {
        const { id } = req.params;
        const result = await testNotifier(id);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json(result);
        }
    });
}

module.exports = {
    getAllNotifiers,
    getNotifierById,
    createNotifier,
    updateNotifier,
    deleteNotifier,
    testNotifier,
    sendNotification,
    setupNotifierRoutes,
    validateNotifierData,
    generateId
}; 