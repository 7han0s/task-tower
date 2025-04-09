# Task Tower

A multiplayer task management game with real-time collaboration.

## Project Structure

```
task-tower/
├── client/           # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # Service layer for API calls
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── server/           # Backend Node.js server
│   ├── src/
│   │   ├── routes/      # API routes
│   │   └── services/    # Backend services
│   └── config/          # Configuration files
└── scripts/          # Setup and utility scripts
```

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Cloud Project with Sheets API enabled

### Installation

1. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. Set up environment variables:
Create `.env` files in both server and client directories:

```
# server/.env
PORT=3001
NODE_ENV=development
GOOGLE_CREDENTIALS={your_service_account_json}
GOOGLE_SPREADSHEET_ID={your_spreadsheet_id}

# client/.env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_SPREADSHEET_ID={your_spreadsheet_id}
```

### Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
cd client
npm start
```

## Development

### Server
- Uses Express.js
- Handles Google Sheets API integration
- Provides REST API endpoints for game state
- Runs on port 3001 by default

### Client
- Built with React
- Communicates with server via REST API
- Handles real-time game state updates
- Runs on port 3000 by default

## API Documentation

### Game State API

- `GET /api/game-state` - Get current game state
- `POST /api/game-state` - Update game state

### Player Data API

- `GET /api/player-data` - Get player data
- `POST /api/player-data` - Update player data

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
