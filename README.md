# Task Tower Plus

A productivity gamification platform that combines task management with visual tower building mechanics in a multiplayer environment.

## Overview

Task Tower transforms task completion into a fun and competitive experience by:
- Visualizing task completion as tower building
- Adding multiplayer elements for collaboration and competition
- Providing meaningful productivity insights
- Gamifying task management with scoring and achievements

## Features

- Multiplayer gameplay (up to 8 players)
- Task management with categories (Work, Chores, Personal)
- Visual tower building mechanics
- Real-time synchronization
- Customizable game settings
- Mobile-responsive design
- Comprehensive analytics
- Google Sheets integration for data persistence

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Styling: Tailwind CSS
- Real-time: WebSocket
- Backend: Supabase (PostgreSQL + Realtime)
- Development: Node.js, npm, ESLint, Jest
- Data Integration: Google Sheets API

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd task-tower
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Sheets Configuration
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

4. Configure Google Sheets Integration:
   a. Go to Google Cloud Console (https://console.cloud.google.com/)
   b. Create a new project or select an existing one
   c. Enable the Google Sheets API
   d. Create OAuth 2.0 credentials:
      - Type: Web application
      - Authorized redirect URI: http://localhost:3000/auth/google/callback
   e. Create a new Google Sheet for your game data
   f. Share the sheet with your Google Cloud project service account

5. Start the development server:
```bash
npm run dev
```

## Development

### Branching Strategy
- `main`: Stable production code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical fixes

### Commit Guidelines
Follow conventional commits:
```
type(scope): description

[optional body]
[optional footer(s)]
```

## Documentation

Documentation is available in the `docs` directory:
- [Specifications](docs/specifications/)
- [Implementation](docs/implementation/)
- [Development](docs/development/)
- [Deployment](docs/deployment/)
- [Setup](docs/setup/)
- [Agents](docs/agents/)

## Contributing

1. Create a feature branch
2. Implement your changes
3. Write tests
4. Update documentation
5. Submit a pull request

## License

MIT License - see LICENSE file for details
