const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'watchcat_secret_key_change_in_production';

// Utility function to read JSON files
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

// Utility function to write JSON files
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Login function
async function login(username, password) {
    if (!username || !password) {
        return {
            success: false,
            message: 'Username and password are required'
        };
    }

    const admins = readJsonFile('./data/admins.json');
    if (!admins) {
        return {
            success: false,
            message: 'Error reading admin data'
        };
    }

    const admin = admins.find(a => a.username === username);
    if (!admin) {
        return {
            success: false,
            message: 'Invalid username or password'
        };
    }

    try {
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return {
                success: false,
                message: 'Invalid username or password'
            };
        }

        const token = jwt.sign(
            { username: admin.username, role: admin.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                username: admin.username,
                role: admin.role
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Verify token function
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return {
            success: true,
            user: decoded
        };
    } catch (error) {
        return {
            success: false,
            message: 'Invalid token'
        };
    }
}

// Create new user function
async function createUser(username, password, role = 'admin') {
    try {
        const admins = readJsonFile('./data/admins.json') || [];

        // Check if user already exists
        const existingUser = admins.find(a => a.username === username);
        if (existingUser) {
            return {
                success: false,
                message: 'User already exists'
            };
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user object
        const newUser = {
            username: username,
            password: hashedPassword,
            role: role,
            createdAt: new Date().toISOString()
        };

        // Add to users array
        admins.push(newUser);

        // Save to file
        const saved = writeJsonFile('./data/admins.json', admins);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving user data'
            };
        }

        return {
            success: true,
            message: 'User created successfully',
            user: {
                username: newUser.username,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        };
    } catch (error) {
        console.error('Create user error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Change password function
async function changePassword(username, oldPassword, newPassword) {
    try {
        const admins = readJsonFile('./data/admins.json');
        if (!admins) {
            return {
                success: false,
                message: 'Error reading admin data'
            };
        }

        const userIndex = admins.findIndex(a => a.username === username);
        if (userIndex === -1) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Verify old password
        const isValidPassword = await bcrypt.compare(oldPassword, admins[userIndex].password);
        if (!isValidPassword) {
            return {
                success: false,
                message: 'Invalid current password'
            };
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        admins[userIndex].password = hashedNewPassword;
        admins[userIndex].updatedAt = new Date().toISOString();

        // Save to file
        const saved = writeJsonFile('./data/admins.json', admins);
        if (!saved) {
            return {
                success: false,
                message: 'Error saving user data'
            };
        }

        return {
            success: true,
            message: 'Password changed successfully'
        };
    } catch (error) {
        console.error('Change password error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Get all users function (without passwords)
function getAllUsers() {
    try {
        const admins = readJsonFile('./data/admins.json');
        if (!admins) {
            return {
                success: false,
                message: 'Error reading admin data'
            };
        }

        // Remove password field from response
        const users = admins.map(admin => ({
            username: admin.username,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt
        }));

        return {
            success: true,
            users: users
        };
    } catch (error) {
        console.error('Get users error:', error);
        return {
            success: false,
            message: 'Internal server error'
        };
    }
}

// Generate password hash utility function
async function generatePasswordHash(password) {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    } catch (error) {
        console.error('Error generating hash:', error);
        return null;
    }
}

// Setup user routes
function setupUserRoutes(app) {
    // Login endpoint
    app.post('/api/login', async (req, res) => {
        const { username, password } = req.body;
        const result = await login(username, password);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('required') ? 400 :
                result.message.includes('reading') ? 500 : 401;
            res.status(statusCode).json(result);
        }
    });

    // Verify token endpoint
    app.get('/api/verify', authenticateToken, (req, res) => {
        res.json({
            success: true,
            user: req.user
        });
    });

    // Create user endpoint
    app.post('/api/users', authenticateToken, async (req, res) => {
        const { username, password, role } = req.body;
        const result = await createUser(username, password, role);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('already exists') ? 409 : 500;
            res.status(statusCode).json(result);
        }
    });

    // Change password endpoint
    app.put('/api/users/password', authenticateToken, async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const username = req.user.username;
        const result = await changePassword(username, oldPassword, newPassword);

        if (result.success) {
            res.json(result);
        } else {
            const statusCode = result.message.includes('Invalid current') ? 401 : 500;
            res.status(statusCode).json(result);
        }
    });

    // Get all users endpoint
    app.get('/api/users', authenticateToken, (req, res) => {
        const result = getAllUsers();

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    });

    // Delete user endpoint
    app.delete('/api/users/:username', authenticateToken, async (req, res) => {
        const { username } = req.params;
        const currentUser = req.user.username;

        // Prevent user from deleting themselves
        if (username === currentUser) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        try {
            const admins = readJsonFile('./data/admins.json');
            if (!admins) {
                return res.status(500).json({
                    success: false,
                    message: 'Error reading admin data'
                });
            }

            const userIndex = admins.findIndex(a => a.username === username);
            if (userIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Remove user from array
            admins.splice(userIndex, 1);

            // Save to file
            const saved = writeJsonFile('./data/admins.json', admins);
            if (!saved) {
                return res.status(500).json({
                    success: false,
                    message: 'Error saving user data'
                });
            }

            res.json({
                success: true,
                message: `User ${username} deleted successfully`
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    });
}

module.exports = {
    authenticateToken,
    login,
    verifyToken,
    createUser,
    changePassword,
    getAllUsers,
    generatePasswordHash,
    readJsonFile,
    writeJsonFile,
    setupUserRoutes
}; 