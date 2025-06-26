const WatchEngine = require('./watch_engine');
const { authenticateToken } = require('../user');

/**
 * Initialize monitoring engine
 */
const watchEngine = new WatchEngine();

/**
 * Get all monitoring templates
 */
function getAllTemplates() {
    try {
        const templates = watchEngine.getAllTemplates();
        return {
            success: true,
            templates: templates
        };
    } catch (error) {
        console.error('Failed to get monitoring templates:', error);
        return {
            success: false,
            message: 'Failed to get monitoring templates',
            error: error.message
        };
    }
}

/**
 * Get single template by ID
 */
function getTemplate(templateId) {
    try {
        const template = watchEngine.getTemplate(templateId);
        if (!template) {
            return {
                success: false,
                message: `Template not found: ${templateId}`
            };
        }
        return {
            success: true,
            template: template
        };
    } catch (error) {
        console.error('Failed to get template:', error);
        return {
            success: false,
            message: 'Failed to get template',
            error: error.message
        };
    }
}

/**
 * Execute monitoring task
 */
async function executeMonitor(templateId, variables) {
    try {
        const result = await watchEngine.executeMonitor(templateId, variables);
        return result;
    } catch (error) {
        console.error('Failed to execute monitoring:', error);
        return {
            success: false,
            message: 'Failed to execute monitoring',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Setup monitoring related routes
 */
function setupWatchRoutes(app) {
    // Get all monitoring templates
    app.get('/api/watch/templates', authenticateToken, (req, res) => {
        const result = getAllTemplates();

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    });

    // Get single template by ID
    app.get('/api/watch/templates/:id', authenticateToken, (req, res) => {
        const { id } = req.params;
        const result = getTemplate(id);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json(result);
        }
    });

    // Execute monitoring task
    app.post('/api/watch/execute', authenticateToken, async (req, res) => {
        const { templateId, variables } = req.body;

        if (!templateId) {
            return res.status(400).json({
                success: false,
                message: 'Missing template ID'
            });
        }

        if (!variables) {
            return res.status(400).json({
                success: false,
                message: 'Missing monitoring variables'
            });
        }

        const result = await executeMonitor(templateId, variables);

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    });

    // Get template classification statistics
    app.get('/api/watch/stats', authenticateToken, (req, res) => {
        try {
            const templates = watchEngine.getAllTemplates();
            const stats = {
                total: templates.length,
                local: templates.filter(t => t.type === 'local').length,
                remote: templates.filter(t => t.type === 'remote').length,
                byType: {}
            };

            // Group statistics by type
            templates.forEach(template => {
                if (!stats.byType[template.type]) {
                    stats.byType[template.type] = [];
                }
                stats.byType[template.type].push({
                    id: template.id,
                    name: template.name,
                    description: template.description
                });
            });

            res.json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error('Failed to get statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get statistics',
                error: error.message
            });
        }
    });
}

module.exports = {
    watchEngine,
    getAllTemplates,
    getTemplate,
    executeMonitor,
    setupWatchRoutes
}; 