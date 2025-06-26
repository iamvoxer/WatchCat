/**
 * Watch Template Manager
 */

class WatchTemplateManager {
    constructor() {
        this.templates = [];
        this.init();
    }

    /**
     * Initialize
     */
    init() {
        this.setupEventListeners();
        this.loadTemplates();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Template details expand/collapse
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('template-header')) {
                this.toggleTemplateDetails(e.target);
            }
        });


    }

    /**
     * Load all templates
     */
    async loadTemplates() {
        try {
            this.showLoading();

            const response = await fetch('/api/watch/templates', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('watchcat_token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.templates = result.templates;
                this.renderTemplates();
            } else {
                this.showError(result.message || 'Failed to load templates');
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            this.showError('Failed to load templates: ' + error.message);
        }
    }

    /**
     * Render templates list
     */
    renderTemplates() {
        const container = document.getElementById('templatesContainer');
        if (!container) return;

        if (this.templates.length === 0) {
            container.innerHTML = `
                <div class="no-templates">
                    <p>No watch templates available</p>
                </div>
            `;
            return;
        }

        const templatesHTML = this.templates.map(template => this.createTemplateCard(template)).join('');
        container.innerHTML = templatesHTML;
    }

    /**
     * Create template card
     */
    createTemplateCard(template) {
        const typeLabel = template.type === 'local' ? 'Local Execution' : 'Remote Execution';
        const typeClass = template.type === 'local' ? 'local' : 'remote';

        // Create variables display
        const variablesHTML = template.variables.map(v =>
            `<div class="variable-item">
                <div class="variable-header">
                    <span class="variable-name">${v.name}</span>
                    <span class="variable-type">${v.type}</span>
                    ${v.required ? '<span class="required-mark">Required</span>' : '<span class="optional-mark">Optional</span>'}
                </div>
                <div class="variable-desc">${v.description}</div>
                ${v.defaultValue ? `<div class="variable-default">Default: ${v.defaultValue}</div>` : ''}
            </div>`
        ).join('');

        // Create metrics display
        const metricsHTML = template.metrics.map(p =>
            `<div class="metric-item">
                <div class="metric-header">
                    <span class="metric-name">${p.name}</span>
                    <span class="metric-type">${p.type}</span>
                </div>
                <div class="metric-desc">${p.description}</div>
            </div>`
        ).join('');

        return `
            <div class="template-card">
                <div class="template-header" data-template-id="${template.id}">
                    <div class="template-title">
                        <h3>${template.name}</h3>
                        <span class="template-type ${typeClass}">${typeLabel}</span>
                    </div>
                    <div class="template-actions">
                        <span class="expand-icon">▼</span>
                    </div>
                </div>
                
                <div class="template-description">
                    <p>${template.description}</p>
                </div>

                <div class="template-summary">
                    <div class="summary-section">
                        <h4>Variables (${template.variables.length})</h4>
                        <div class="variables-summary">
                            ${template.variables.map(v =>
            `<span class="variable-tag ${v.required ? 'required' : 'optional'}">${v.name}${v.required ? '*' : ''}</span>`
        ).join('')}
                        </div>
                    </div>

                    <div class="summary-section">
                        <h4>Metrics (${template.metrics.length})</h4>
                        <div class="metrics-summary">
                            ${template.metrics.map(p =>
            `<span class="metric-tag">${p.name} (${p.type})</span>`
        ).join('')}
                        </div>
                    </div>
                </div>

                <div class="template-details" style="display: none;">
                    <div class="detail-section">
                        <h4>Variable Details</h4>
                        <div class="variables-detail">
                            ${variablesHTML}
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>Metric Details</h4>
                        <div class="metrics-detail">
                            ${metricsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle template details display
     */
    toggleTemplateDetails(header) {
        const card = header.closest('.template-card');
        const details = card.querySelector('.template-details');
        const icon = header.querySelector('.expand-icon');

        if (details.style.display === 'none') {
            details.style.display = 'block';
            icon.textContent = '▲';
            header.classList.add('expanded');
        } else {
            details.style.display = 'none';
            icon.textContent = '▼';
            header.classList.remove('expanded');
        }
    }



    /**
     * Show loading state
     */
    showLoading() {
        const container = document.getElementById('templatesContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading-message">
                    <div class="loading-spinner"></div>
                    <p>Loading watch templates...</p>
                </div>
            `;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.getElementById('templatesContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <p>❌ ${message}</p>
                    <button class="btn btn-primary" onclick="watchManager.loadTemplates()">Reload</button>
                </div>
            `;
        }
    }
}

// Global instance
let watchManager;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the watch templates page
    if (document.getElementById('templatesContainer')) {
        watchManager = new WatchTemplateManager();
    }
}); 