# Task Tower

A collaborative task management game that helps teams stay productive and engaged.

## Features

- Task Management System
- Real-time Collaboration
- Scoring System
- Player Rankings
- Task Complexity Tracking
- Google Sheets Integration

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy `.env.example` to `.env`
- Add your Google API credentials

3. Run the development server:
```bash
npm start
```

## Project Structure

```
├── dist/            # Built files
├── public/          # Static assets
├── scripts/
│   ├── core/       # Core game logic
│   ├── ui/         # User interface components
│   └── test/       # Test files
└── docs/           # Documentation
```

## Development

### Branches

- `main`: Production code
- `dev-testing`: Development testing
- `feature/*`: Feature branches
- `hotfix/*`: Hotfix branches

### Versioning

- Follow semantic versioning (x.y.z)
- MVP target: x.1.10 (alpha)
- Current revision: x.0.9

## License

MIT
