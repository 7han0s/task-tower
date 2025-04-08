# Task Tower Game - Comprehensive Specification and Implementation Guide

## 1. Project Overview

### 1.1 Core Concept
Task Tower is a productivity gamification platform that combines task management with visual tower building mechanics in a multiplayer environment. The game aims to make task completion fun and competitive while providing meaningful productivity insights.

### 1.2 Technical Architecture
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Styling: Tailwind CSS
- Audio: Native HTML5 Audio
- Backend: Google Sheets API
- Hosting: GitHub Pages

## 2. Technical Requirements

### 2.1 Dependencies
```json
{
    "dependencies": {
        "tailwindcss": "^3.3.0",
        "autoprefixer": "^10.4.14",
        "postcss": "^8.4.21"
    },
    "devDependencies": {
        "@google-cloud/sheets": "^6.1.0",
        "typescript": "^5.0.0"
    }
}
```

### 2.2 Development Environment
- Node.js >= 14.0.0
- npm >= 6.0.0
- Google Cloud SDK
- Google Sheets API credentials

## 3. Core Systems

### 3.1 Task Management System

#### Task Structure
```javascript
class Task {
    constructor(id, description, category, playerId, estimatedDuration, isBigTask) {
        this.id = id;
        this.description = description;
        this.category = category;
        this.playerId = playerId;
        this.estimatedDuration = estimatedDuration;
        this.actualDuration = 0;
        this.isBigTask = isBigTask;
        this.created = new Date();
        this.completed = null;
        this.subtasks = [];
        this.points = 0;
    }
}
```

#### Task Categories
- Personal (1 point)
- Chores (2 points)
- Work (3 points)
- Big tasks: 50% bonus

### 3.2 Multiplayer System

#### Lobby System
```javascript
class Lobby {
    constructor(code, hostId) {
        this.code = code;
        this.hostId = hostId;
        this.players = new Map();
        this.status = 'waiting';
        this.gameMode = 'competitive';
        this.settings = {
            rounds: 4,
            workTime: 25, // minutes
            breakTime: 5 // minutes
        };
    }
}
```

#### Game State Synchronization
```javascript
const SYNC_INTERVAL_MS = 5000;

async function syncGameState(gameState) {
    if (!isOnlineMode) {
        currentGameState = gameState;
        return Promise.resolve({ success: true });
    }
    
    try {
        await saveGameStateToSheet(gameState);
        return Promise.resolve({ success: true });
    } catch (error) {
        console.error('Error syncing game state:', error);
        return Promise.resolve({ success: false });
    }
}
```

## 4. UI Implementation

### 4.1 Styling System

#### Color Scheme
```css
:root {
    --background: #f5f5f5;
    --text-primary: #333;
    --text-secondary: #666;
    --card-background: #fff;
    --card-border: #e0e0e0;
    --button-primary: #4CAF50;
    --button-text: #fff;
    --button-primary-hover: #45a049;
    --task-background: #f8f9fa;
    --link-color: #007bff;
    --error-color: #dc3545;
    --success-color: #28a745;
}
```

### 4.2 Component Structure

#### Player Card
```html
<div class="player-card p-4 border-2 border-gray-600 rounded-lg text-center flex flex-col h-full">
    <h4 class="text-lg font-bold mb-3 border-b border-gray-700 pb-2">${player.name}</h4>
    <div class="tower-container mx-auto mb-3 flex-grow" id="tower-${player.id}"></div>
    <div class="text-xl mb-3 bg-gray-900 rounded py-1">Score: <span id="score-${player.id}">${player.score}</span></div>
    <div class="pending-tasks-summary text-center mt-auto border-t border-gray-700 pt-3">
        <div class="text-sm">Pending Tasks: <span id="pending-count-${player.id}">0</span></div>
    </div>
</div>
```

## 5. Audio System

### 5.1 Sound Effects
```javascript
const audio = {
    phaseChange: new Audio('sounds/phase-change.mp3'),
    timerTick: new Audio('sounds/timer-tick.mp3'),
    taskComplete: new Audio('sounds/task-complete.mp3'),
    gameStart: new Audio('sounds/game-start.mp3'),
    gameEnd: new Audio('sounds/game-end.mp3'),
    pause: new Audio('sounds/pause.mp3'),
    resume: new Audio('sounds/resume.mp3')
};

function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        sound.play();
    }
}
```

## 6. Google Sheets Integration

### 6.1 Sheet Structure

#### Game State Sheet
- Column A: Lobby Code
- Column B: Current Phase
- Column C: Current Round
- Column D: Timer

#### Player Data Sheet
- Column A: Player ID
- Column B: Name
- Column C: Score
- Column D: Current Tasks (JSON)

### 6.2 API Implementation
```javascript
async function saveGameStateToSheet(gameState) {
    try {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: googleSheetId,
            range: 'Game State!A2:D2',
            valueInputOption: 'RAW',
            resource: {
                values: [[
                    gameState.lobbyCode,
                    gameState.currentPhase,
                    gameState.currentRound,
                    gameState.timer
                ]]
            }
        });
        
        const playerData = gameState.players.map(player => [
            player.id,
            player.name,
            player.score,
            JSON.stringify(player.pendingTasks)
        ]);
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: googleSheetId,
            range: 'Player Data!A2',
            valueInputOption: 'RAW',
            resource: {
                values: playerData
            }
        });
        
        return true;
    } catch (error) {
        console.error('Error saving game state:', error);
        return false;
    }
}
```

## 7. Game Mechanics

### 7.1 Round Structure
- Work Phase: 25 minutes (configurable)
- Action Phase: 5 minutes (configurable)
- Break Phase: 5 minutes (configurable)

### 7.2 Scoring System
```javascript
function calculateTaskScore(task) {
    let basePoints = 0;
    switch(task.category) {
        case 'personal': basePoints = 1; break;
        case 'chores': basePoints = 2; break;
        case 'work': basePoints = 3; break;
    }
    
    let score = basePoints;
    if (task.isBigTask) {
        score *= 1.5;
    }
    
    // Efficiency bonus (up to 50%)
    if (task.actualDuration < task.estimatedDuration) {
        const efficiency = (1 - (task.actualDuration / task.estimatedDuration)) * 0.5;
        score += score * efficiency;
    }
    
    return Math.round(score);
}
```

## 8. Task Import/Export System

### 8.1 Supported Formats
- JSON
- CSV
- Markdown tables

### 8.2 Task Validation Rules
```javascript
const taskValidationRules = {
    description: {
        required: true,
        maxLength: 100,
        pattern: /^[a-zA-Z0-9\s\p{P}]+$/u
    },
    category: {
        required: true,
        allowedValues: ['personal', 'chores', 'work']
    },
    time: {
        optional: true,
        min: 0,
        max: 1440
    },
    big: {
        optional: true,
        type: 'boolean'
    }
};
```

## 9. UI/UX Guidelines

### 9.1 Visual Design
- Font: 'Press Start 2P', cursive
- Color scheme: Retro gaming palette
- Responsive layout using Tailwind CSS
- Smooth animations and transitions

### 9.2 User Interaction
- Intuitive task creation interface
- Visual feedback for actions
- Clear phase indicators
- Score visualization
- Tower building mechanics

## 10. Development Guidelines

### 10.1 Code Organization
- Modular JavaScript architecture
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive error handling

### 10.2 Testing Requirements
- Unit tests for core functionality
- Integration tests for API interactions
- Performance testing
- Cross-browser compatibility testing

### 10.3 Documentation
- Code comments
- API documentation
- User guides
- Setup instructions

## 11. Security Considerations

### 11.1 Authentication
- Google OAuth 2.0 for online multiplayer
- API key management
- Sheet access permissions
- Data validation

### 11.2 Data Protection
- Secure API endpoints
- Data encryption
- Rate limiting
- Error handling

## 12. Future Enhancements

### 12.1 Planned Features
- Real-time updates using WebSockets
- Task templates and recommendations
- Advanced statistics and reporting
- Custom game modes
- Mobile optimization

### 12.2 Technical Improvements
- Performance optimization
- Error recovery system
- Enhanced synchronization
- Better offline support

## 13. Deployment Guide

### 13.1 Setup Instructions
1. Install dependencies
2. Configure Google Sheets API
3. Set up environment variables
4. Build assets
5. Deploy to GitHub Pages

### 13.2 Maintenance
- Regular backups
- Performance monitoring
- Security updates
- Feature updates

## 14. Troubleshooting

### 14.1 Common Issues
- API connection errors
- Sync conflicts
- Performance issues
- Browser compatibility

### 14.2 Solutions
- Error logging
- Fallback mechanisms
- User guidance
- Technical support
