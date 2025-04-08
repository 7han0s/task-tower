# Task Tower Deployment Guide

## 1. Prerequisites

### 1.1 Development Environment
- Node.js (Latest LTS version)
- npm (Latest version)
- Git
- Modern browser
- Text editor/IDE

### 1.2 Accounts Required
- GitHub account
- Netlify account
- Supabase account
- Google Cloud account (for Google Sheets)

## 2. Local Development Setup

### 2.1 Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Supabase CLI
npm install -g supabase
```

### 2.2 Environment Setup
Create a `.env` file in the root directory:
```
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Sheets
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2.3 Start Development Server
```bash
# Start local development server
npm run dev
```

## 3. Deployment Process

### 3.1 Build Process
```bash
# Build the project
npm run build

# Build CSS
npm run build:css

# Build JavaScript
npm run build:js
```

### 3.2 Deploy to Netlify
```bash
# Deploy to Netlify
netlify deploy --prod
```

### 3.3 Supabase Setup
1. Create a new project in Supabase
2. Set up database schema
3. Configure RLS policies
4. Set up Edge Functions

## 4. Configuration

### 4.1 Database Configuration
```sql
-- Create game_state table
CREATE TABLE game_state (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lobby_code TEXT UNIQUE,
    round INTEGER,
    phase TEXT,
    timer INTEGER
);

-- Create player_data table
CREATE TABLE player_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    lobby_code TEXT REFERENCES game_state(lobby_code),
    player_id INTEGER,
    score INTEGER,
    tasks JSONB
);
```

### 4.2 Real-time Configuration
```javascript
// Supabase Realtime configuration
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const channel = supabase
    .channel('game-state')
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state'
    }, (payload) => {
        // Handle state changes
    })
    .subscribe();
```

## 5. Monitoring and Maintenance

### 5.1 Performance Monitoring
- Page load times
- Real-time updates
- Memory usage
- CPU usage

### 5.2 Error Tracking
- Frontend errors
- Backend errors
- Network issues
- Database errors

### 5.3 Regular Maintenance
- Database backups
- Code updates
- Security patches
- Performance optimization

## 6. Troubleshooting

### 6.1 Common Issues
1. Real-time synchronization delays
2. Database connection issues
3. Authentication errors
4. Performance bottlenecks

### 6.2 Solutions
1. Check network connection
2. Verify database configuration
3. Review authentication setup
4. Optimize code and assets
