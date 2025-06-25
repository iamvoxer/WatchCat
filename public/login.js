// Login form handling
document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const loading = document.getElementById('loading');

    // Check if user is already logged in
    const token = localStorage.getItem('watchcat_token');
    if (token) {
        verifyToken(token);
    }

    // Handle form submission
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        setLoading(true);
        clearError();

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store token in localStorage
                localStorage.setItem('watchcat_token', data.token);
                localStorage.setItem('watchcat_user', JSON.stringify(data.user));

                // Redirect to main page
                window.location.href = '/index.html';
            } else {
                showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // Verify existing token
    async function verifyToken(token) {
        try {
            const response = await fetch('/api/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Token is valid, redirect to main page
                window.location.href = '/index.html';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('watchcat_token');
                localStorage.removeItem('watchcat_user');
            }
        } catch (error) {
            console.error('Token verification error:', error);
            // Remove invalid token
            localStorage.removeItem('watchcat_token');
            localStorage.removeItem('watchcat_user');
        }
    }

    // Utility functions
    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
            loading.style.display = 'block';
        } else {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
            loading.style.display = 'none';
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function clearError() {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }

    // Handle Enter key press
    document.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
}); 