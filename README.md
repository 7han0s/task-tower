# Task Tower

A web-based game management system that uses Google Sheets as its backend data store.

## Features

- Game state management
- Task management
- Player management
- Real-time synchronization
- Secure authentication

## Architecture

Task Tower consists of three main components:

1. **Client Application**: React-based frontend
2. **Server Application**: Node.js/Express server
3. **Google Sheets**: Data storage and synchronization layer

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Google Cloud Platform account
- Google Sheets API credentials

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd task-tower
```

2. Install dependencies:
```bash
cd server
npm install
cd ../client
npm install
```

3. Set up environment variables:
Create a `.env` file in both `server` and `client` directories with the following variables:

#### Server Environment Variables
```
GOOGLE_CREDENTIALS={your-google-credentials}
GOOGLE_SPREADSHEET_ID={your-spreadsheet-id}
```

#### Client Environment Variables
```
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GOOGLE_SPREADSHEET_ID={your-spreadsheet-id}
```

### Running the Application

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the client:
```bash
cd client
npm start
```

The application will be available at `http://localhost:3001`.

## Development

### Code Structure

#### Server
```
server/
├── src/
│   ├── google-service.js    # Google Sheets API integration
│   └── index.js            # Express server setup
├── __tests__/              # Server-side tests
└── package.json
```

#### Client
```
client/
├── src/
│   ├── components/         # React components
│   ├── services/          # Service layer
│   │   └── game-sheets.js # Game state synchronization
│   └── App.js             # Main application component
├── __tests__/             # Client-side tests
└── package.json
```

### Testing

Run tests for both server and client:
```bash
cd server
npm test

cd ../client
npm test
```

## Deployment

The application can be deployed using Docker containers. The deployment process is automated through GitHub Actions.

## Security

- All API endpoints are protected
- Input validation and sanitization
- Secure authentication
- Encrypted communication (HTTPS)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
