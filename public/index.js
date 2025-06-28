// Main index.js - Application Entry Point
let currentUser = null;
let currentSection = 'servers';

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

// Application initialization
function initializeApp() {
    checkAuthAndSetup();
    setupEventListeners();
}

// Check authentication and setup UI
function checkAuthAndSetup() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Verify token with server
    fetch('/api/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Token verification failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                currentUser = data.user;
                setupUserInterface();
            } else {
                throw new Error('Invalid token');
            }
        })
        .catch(error => {
            console.error('Auth verification failed:', error);
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        });
}

// Setup user interface
function setupUserInterface() {
    // Update user info in header
    const userInfo = document.querySelector('.user-info');
    if (userInfo && currentUser) {
        userInfo.textContent = `Welcome, ${currentUser.username}`;
    }

    // Show servers section by default
    showSection('servers');
}

// Event listeners setup
function setupEventListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
            }
        });
    });

    // Logout functionality
    const logoutBtn = document.getElementById('headerLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
        });
    }
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionName;

        // Add active class to corresponding nav link
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load section-specific data
        loadSectionData(sectionName);
    }
}

// Load data based on section
function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'servers':
            // Call loadServers from server.js if it exists
            if (typeof loadServers === 'function') {
                loadServers();
            }
            break;
        case 'notifiers':
            // Notifiers will load their own data when initialized
            break;
        case 'watch-templates':
            // Load watch templates if function exists
            if (typeof loadWatchTemplates === 'function') {
                loadWatchTemplates();
            }
            break;
        case 'alerts':
            // Load alerts if function exists
            if (typeof loadAlerts === 'function') {
                loadAlerts();
            }
            break;
        default:
            console.log(`No specific data loading for section: ${sectionName}`);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    window.location.href = '/login.html';
} 