# Task Tower

A productivity gamification platform that combines task management with visual tower building mechanics in a multiplayer environment.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Development](#development)
  - [Running Locally](#running-locally)
  - [Development Workflow](#development-workflow)
  - [Testing](#testing)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

Task Tower is a productivity game that helps users manage their tasks through a gamified interface. Players can compete or collaborate in real-time while building their virtual towers based on completed tasks.

## Features

- Multiplayer gameplay (local and online)
- Task management system
- Visual tower building
- Real-time synchronization
- Score tracking
- Multiple game modes
- Task categorization
- Efficiency scoring

## Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Tailwind CSS
- Web Audio API
- HTML5 Canvas

### Backend
- Supabase
- PostgreSQL
- Edge Functions
- Realtime
- Authentication

### Development Tools
- Node.js
- npm
- ESLint
- Jest
- GitHub Actions
- PostCSS
- Autoprefixer

## Getting Started

### Prerequisites

- Node.js (Latest LTS version)
- npm (Latest version)
- Git
- Modern browser
- Text editor/IDE

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/task-tower.git
cd task-tower
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Sheets
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Configuration

1. Database setup:
```bash
# Set up Supabase
supabase init
```

2. Build assets:
```bash
npm run build
```

## Development

### Running Locally

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

### Development Workflow

1. Create a feature branch:
```bash
git checkout -b feature/your-feature
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: your feature description"
```

3. Push to your branch:
```bash
git push origin feature/your-feature
```

4. Create a Pull Request

### Testing

Run tests:
```bash
npm test
```

Run specific test:
```bash
npm test -- test/specific-test.spec.js
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify:
```bash
netlify deploy --prod
```

## Documentation

All documentation is available in the [docs](docs) directory:
- [Specifications](docs/specifications)
- [Implementation](docs/implementation)
- [Development](docs/development)
- [Deployment](docs/deployment)
- [Setup](docs/setup)
- [Agents](docs/agents)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a Pull Request

## License

ISC License

## Support

For support, please open an issue in the GitHub repository.
