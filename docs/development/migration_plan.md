# Migration Plan - Task Tower Plus

## Overview
This document outlines the plan for migrating the existing codebase to use both Google Sheets and Supabase for data persistence and real-time functionality.

## Current State

### Existing Codebase
- Core game logic in `game-core.js`
- Basic task management system
- Partial multiplayer implementation
- Google Sheets integration (needs migration)
- Supabase planned for future migration

### Data Models
- Game State
  - Current round
  - Current phase
  - Timer
  - Player count

- Player Data
  - Player ID
  - Name
  - Score
  - Tasks
  - Tower blocks

## Migration Plan

### Phase 1: Google Sheets Integration (1-2 weeks)
1. **Data Structure Setup**
   - Create Google Sheet templates
   - Define data models
   - Set up sheet sharing
   - Update .env with sheet ID

2. **Core Integration**
   - Update game-core.js
   - Implement data synchronization
   - Add error handling
   - Create backup system

3. **Testing**
   - Unit tests for Google service
   - Integration tests for data sync
   - Performance testing
   - Error recovery testing

### Phase 2: Supabase Migration (2-3 weeks)
1. **Database Setup**
   - Create Supabase project
   - Set up database schema
   - Configure RLS
   - Set up Edge Functions

2. **Data Migration**
   - Create migration scripts
   - Implement data synchronization
   - Add conflict resolution
   - Set up real-time updates

3. **Integration**
   - Update multiplayer system
   - Implement real-time features
   - Add authentication
   - Set up monitoring

### Phase 3: Optimization (1-2 weeks)
1. **Performance**
   - Implement caching
   - Optimize data fetching
   - Add batch operations
   - Implement rate limiting

2. **Monitoring**
   - Add performance metrics
   - Implement error tracking
   - Set up usage analytics
   - Add monitoring dashboard

## Technical Considerations

### Data Models
```javascript
// Game State
{
    lobbyCode: string,
    currentPhase: string,
    currentRound: number,
    timer: number,
    players: Array<Player>
}

// Player
{
    id: number,
    name: string,
    score: number,
    tasks: Array<Task>,
    towerBlocks: Array<Block>,
    lastAction: string
}

// Task
{
    id: number,
    description: string,
    category: string,
    points: number,
    isCompleted: boolean
}
```

### Migration Scripts
1. **CSV to Google Sheets**
```javascript
async function migrateCsvToSheets() {
    // Read CSV files
    const gameState = await readCsv('game_state.csv');
    const playerData = await readCsv('player_data.csv');

    // Update sheets
    await googleService.updateSheetData('Game State!A1:D2', gameState);
    await googleService.updateSheetData('Player Data!A1:D' + (playerData.length + 1), playerData);
}
```

2. **State Backup**
```javascript
async function backupGameState() {
    try {
        const gameState = await googleService.getSheetData('Game State!A1:D2');
        const playerData = await googleService.getSheetData('Player Data!A1:D100');

        // Save backup
        await saveBackup({
            timestamp: new Date().toISOString(),
            gameState,
            playerData
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        // Implement retry mechanism
    }
}
```

## Testing Requirements

### Unit Tests
1. Google Service
   - Authentication flow
   - API interactions
   - Data models
   - Error handling

2. Data Models
   - Game state validation
   - Player data validation
   - Task management
   - Score tracking

### Integration Tests
1. Complete authentication cycle
2. Data persistence
3. Real-time updates
4. Error recovery

### Performance Tests
1. API response times
2. Data synchronization
3. Load handling
4. Recovery mechanisms

## Timeline

### Week 1
- Set up Google Sheets integration
- Create data models
- Implement basic synchronization
- Add error handling

### Week 2
- Complete data migration
- Implement backup system
- Add monitoring
- Test integration

### Week 3
- Start Supabase migration
- Set up database
- Implement real-time features
- Add authentication

### Week 4
- Complete Supabase integration
- Add optimization
- Set up monitoring
- Final testing

## Resources Needed

### Development
- Google Cloud Project
- Supabase account
- Development environment
- Testing tools

### Testing
- Test accounts
- Performance testing tools
- Monitoring tools
- Error tracking system

## Risks and Mitigations

### Risks
1. Data migration issues
2. API rate limiting
3. Performance bottlenecks
4. Authentication failures

### Mitigations
1. Regular backups
2. Retry mechanisms
3. Performance optimization
4. Error recovery systems

## Next Steps

1. **Immediate Tasks**
   - Create Google Sheet templates
   - Update game-core.js
   - Implement error handling
   - Create unit tests

2. **Short-term Goals**
   - Complete data migration
   - Implement backup system
   - Add monitoring
   - Test integration

3. **Long-term Goals**
   - Complete Supabase migration
   - Add advanced features
   - Optimize performance
   - Add analytics
