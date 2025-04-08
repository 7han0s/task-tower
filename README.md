# Task Tower

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

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Styling: Tailwind CSS
- Real-time: WebSocket
- Backend: Supabase (PostgreSQL + Realtime)
- Development: Node.js, npm, ESLint, Jest

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
```

4. Start the development server:
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
