# WatchCat 🐱

A lightweight server monitoring system built with Node.js and Socket.IO.

## Features

- **Real-time monitoring**: WebSocket-based communication for instant updates
- **User authentication**: Secure login system with JWT tokens
- **Server management**: Monitor multiple servers via SSH
- **Service monitoring**: Track services and applications
- **Alert system**: Configurable thresholds and notifications
- **Web dashboard**: Modern, responsive interface

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd WatchCat
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

4. Open your browser and navigate to:

```
http://localhost:3000
```

### Default Login

- **Username**: admin
- **Password**: admin123456

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Architecture

- **Node.js Backend**: Express.js server with Socket.IO for real-time communication
- **Web Frontend**: Vanilla JavaScript with modern UI
- **Data Storage**: JSON files (no database required)
- **Authentication**: JWT-based session management

## Configuration

All configuration is stored in JSON files under the `data/` directory:

- `data/admins.json` - User authentication data
- `data/servers.json` - Server configurations
- `data/services.json` - Service definitions
- `data/alerts.json` - Alert rules

## API Endpoints

### Authentication

- `POST /api/login` - User login
- `GET /api/verify` - Token verification

### WebSocket Events

- `webToNode` - Client to server messages
- `nodeToWeb` - Server to client messages

## Project Structure

```
WatchCat/
├── index.js              # Main server file
├── package.json          # Project dependencies
├── data/                 # JSON data storage
│   ├── admins.json       # User accounts
│   ├── servers.json      # Server configs
│   ├── services.json     # Service configs
│   └── alerts.json       # Alert rules
└── public/               # Web frontend
    ├── login.html        # Login page
    ├── login.js          # Login logic
    ├── index.html        # Main dashboard
    └── index.js          # Dashboard logic
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
