// Notifier Management Module
(async function () {
    let notifiers = [];
    let currentEditingNotifier = null;

    // DOM elements
    const notifiersContainer = document.getElementById('notifiersContainer');
    const addNotifierBtn = document.getElementById('addNotifierBtn');
    const notifierSidebar = document.getElementById('notifierSidebar');
    const notifierSidebarOverlay = document.getElementById('notifierSidebarOverlay');
    const notifierSidebarClose = document.getElementById('notifierSidebarClose');
    const notifierForm = document.getElementById('notifierForm');
    const notifierSidebarTitle = document.getElementById('notifierSidebarTitle');
    const notifierFormSubmitText = document.getElementById('notifierFormSubmitText');

    // Initialize notifier module
    function initializeNotifiers() {
        setupEventListeners();
        loadNotifiers();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Add notifier button
        addNotifierBtn?.addEventListener('click', () => {
            openNotifierForm();
        });

        // Sidebar close events
        notifierSidebarClose?.addEventListener('click', closeNotifierForm);
        notifierSidebarOverlay?.addEventListener('click', closeNotifierForm);

        // Form submission
        notifierForm?.addEventListener('submit', handleFormSubmit);
    }

    // Load notifiers from server
    async function loadNotifiers() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/notifiers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load notifiers');
            }

            const result = await response.json();
            if (result.success) {
                notifiers = result.notifiers;
                renderNotifiers();
            } else {
                throw new Error(result.message || 'Failed to load notifiers');
            }
        } catch (error) {
            console.error('Load notifiers error:', error);
            showError('Failed to load notifiers: ' + error.message);
        }
    }

    // Open notifier form for adding/editing
    function openNotifierForm(notifier = null) {
        currentEditingNotifier = notifier;

        if (notifier) {
            // Edit mode
            notifierSidebarTitle.textContent = 'Edit Notifier';
            notifierFormSubmitText.textContent = 'Update Notifier';
            populateForm(notifier);
        } else {
            // Add mode
            notifierSidebarTitle.textContent = 'Add Notifier';
            notifierFormSubmitText.textContent = 'Add Notifier';
            clearForm();
        }

        notifierSidebar.classList.add('active');
        notifierSidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close notifier form
    function closeNotifierForm() {
        notifierSidebar.classList.remove('active');
        notifierSidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
        currentEditingNotifier = null;
        clearForm();
    }

    // Populate form with notifier data
    function populateForm(notifier) {
        document.getElementById('notifierName').value = notifier.name || '';
        document.getElementById('notifierDesc').value = notifier.description || '';
        document.getElementById('notifierType').value = notifier.type || 'email';
        document.getElementById('notifierEmails').value = notifier.emails?.join(', ') || '';

        // SMTP Configuration
        document.getElementById('smtpHost').value = notifier.smtpHost || '';
        document.getElementById('smtpPort').value = notifier.smtpPort || 587;
        document.getElementById('smtpUser').value = notifier.smtpUser || '';
        document.getElementById('smtpPassword').value = ''; // Never populate password
    }

    // Clear form
    function clearForm() {
        notifierForm.reset();
        document.getElementById('notifierType').value = 'email';
        document.getElementById('smtpPort').value = 587;
    }

    // Handle form submission
    async function handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(notifierForm);
        const notifierData = {
            name: formData.get('name'),
            description: formData.get('desc'),
            type: formData.get('type'),
            emails: formData.get('emails')?.split(',').map(email => email.trim()).filter(email => email),
            smtpHost: formData.get('smtpHost'),
            smtpPort: parseInt(formData.get('smtpPort')),
            smtpUser: formData.get('smtpUser'),
            smtpPassword: formData.get('smtpPassword')
        };

        // Validation
        if (!notifierData.name) {
            showError('Notifier name is required');
            return;
        }

        if (!notifierData.emails || notifierData.emails.length === 0) {
            showError('At least one email address is required');
            return;
        }

        if (!notifierData.smtpHost || !notifierData.smtpUser) {
            showError('SMTP configuration is required');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of notifierData.emails) {
            if (!emailRegex.test(email)) {
                showError(`Invalid email address: ${email}`);
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            let url = '/api/notifiers';
            let method = 'POST';

            if (currentEditingNotifier) {
                // Update existing notifier
                url = `/api/notifiers/${currentEditingNotifier.id}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(notifierData)
            });

            const result = await response.json();

            if (result.success) {
                showSuccess(result.message);
                closeNotifierForm();
                await loadNotifiers(); // Reload the list
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('Error submitting notifier:', error);
            showError('Failed to save notifier');
        }
    }

    // Render notifiers list
    function renderNotifiers() {
        if (!notifiersContainer) return;

        if (notifiers.length === 0) {
            notifiersContainer.innerHTML = `
                <div class="loading-message">
                    <p>No notifiers configured</p>
                </div>
            `;
            return;
        }

        notifiersContainer.innerHTML = notifiers.map(notifier => createNotifierCard(notifier)).join('');

        // Add event listeners for notifier cards
        setupNotifierCardListeners();
    }

    // Create notifier card HTML
    function createNotifierCard(notifier) {
        const statusClass = notifier.enabled !== false ? '' : 'disabled';
        const emailCount = notifier.emails?.length || 0;

        return `
            <div class="notifier-card" data-notifier-id="${notifier.id}">
                <div class="notifier-card-header" onclick="toggleNotifierDetails('${notifier.id}')">
                    <div class="notifier-info">
                        <div class="notifier-status ${statusClass}"></div>
                        <div>
                            <h4 style="margin: 0; font-size: 1rem;">${escapeHtml(notifier.name)}</h4>
                            <p style="margin: 0.25rem 0 0 0; color: var(--color-text-600); font-size: 0.875rem;">
                                ${notifier.description || 'No description'}
                            </p>
                        </div>
                        <div class="notifier-type-badge">
                            📧 ${notifier.type || 'email'}
                        </div>
                        <span style="color: var(--color-text-500); font-size: 0.875rem;">
                            ${emailCount} recipient${emailCount !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div class="notifier-actions" onclick="event.stopPropagation()">
                        <sl-button size="small" variant="default" onclick="editNotifier('${notifier.id}')">
                            <sl-icon slot="prefix" name="pencil"></sl-icon>
                            Edit
                        </sl-button>
                        <sl-button size="small" variant="default" onclick="testNotifier('${notifier.id}')">
                            <sl-icon slot="prefix" name="send"></sl-icon>
                            Test
                        </sl-button>
                        <sl-button size="small" variant="danger" onclick="deleteNotifier('${notifier.id}')">
                            <sl-icon slot="prefix" name="trash"></sl-icon>
                            Delete
                        </sl-button>
                        <span class="expand-icon" id="expand-${notifier.id}">▶</span>
                    </div>
                </div>
                <div class="notifier-content" id="content-${notifier.id}">
                    <div class="notifier-details">
                        <div class="detail-item">
                            <div class="detail-label">Email Recipients</div>
                            <div class="detail-value">${(notifier.emails || []).join(', ')}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">SMTP Server</div>
                            <div class="detail-value">${escapeHtml(notifier.smtpHost || '')}:${notifier.smtpPort || 587}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">SMTP Username</div>
                            <div class="detail-value">${escapeHtml(notifier.smtpUser || '')}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Status</div>
                            <div class="detail-value">${notifier.enabled !== false ? 'Enabled' : 'Disabled'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Setup event listeners for notifier cards
    function setupNotifierCardListeners() {
        // Make functions globally available for onclick handlers
        window.editNotifier = editNotifier;
        window.deleteNotifier = deleteNotifier;
        window.testNotifier = testNotifier;
        window.toggleNotifierDetails = toggleNotifierDetails;
    }

    // Toggle notifier details
    function toggleNotifierDetails(notifierId) {
        const content = document.getElementById(`content-${notifierId}`);
        const icon = document.getElementById(`expand-${notifierId}`);

        if (content && icon) {
            const isExpanded = content.classList.contains('expanded');

            if (isExpanded) {
                content.classList.remove('expanded');
                icon.classList.remove('expanded');
            } else {
                content.classList.add('expanded');
                icon.classList.add('expanded');
            }
        }
    }

    // Edit notifier
    function editNotifier(notifierId) {
        const notifier = notifiers.find(n => n.id === notifierId);
        if (notifier) {
            openNotifierForm(notifier);
        }
    }

    // Delete notifier
    async function deleteNotifier(notifierId) {
        const notifier = notifiers.find(n => n.id === notifierId);
        if (!notifier) return;

        const confirmed = await showConfirm(
            `Are you sure you want to delete the notifier "${notifier.name}"?`,
            'Delete Notifier'
        );

        if (confirmed) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/notifiers/${notifierId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const result = await response.json();

                if (result.success) {
                    showSuccess(result.message);
                    await loadNotifiers(); // Reload the list
                } else {
                    showError(result.message);
                }
            } catch (error) {
                console.error('Delete notifier error:', error);
                showError('Failed to delete notifier');
            }
        }
    }

    // Test notifier
    async function testNotifier(notifierId) {
        const notifier = notifiers.find(n => n.id === notifierId);
        if (!notifier) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            showInfo(`Sending test notification to ${notifier.name}...`);
            const response = await fetch(`/api/notifiers/${notifierId}/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });


            // Handle both success and failure responses
            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    showSuccess(result.message);
                } else {
                    showError(result.message);
                }
            } else {
                // Handle HTTP errors (404, 500, etc.)
                const result = await response.json();
                console.log('HTTP错误响应:', result);
                showError(result.message || 'Test request failed');
            }
        } catch (error) {
            showError('Failed to test notifier: Network error');
        }
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text?.replace(/[&<>"']/g, m => map[m]) || '';
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNotifiers);
    } else {
        initializeNotifiers();
    }
})(); 