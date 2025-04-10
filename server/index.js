require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { googleService } = require('./src/google-service');

const app = express();

// Store lobbies in memory (in production, use a database)
const lobbies = new Map();

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:8082',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Google Service
googleService.init();

// Google Sheets configuration
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

// Initialize Google Sheets
async function initializeSheets() {
  try {
    await doc.useServiceAccountAuth({
      client_email: JSON.parse(process.env.GOOGLE_CREDENTIALS).client_email,
      private_key: JSON.parse(process.env.GOOGLE_CREDENTIALS).private_key.replace(/\\n/g, '\n'),
    });
    await doc.loadInfo();
  } catch (error) {
    console.error('Failed to initialize Google Sheets:', error);
    throw error;
  }
}

// Initialize game state for a lobby
function initializeGameState() {
  return {
    players: [
      { 
        id: 1, 
        name: 'Player 1', 
        score: 0,
        tasks: []
      }
    ],
    currentPhase: 'WORK',
    timeRemaining: 1500,
    settings: {
      roundDuration: 25,
      categories: ['Personal', 'Chores', 'Work']
    }
  };
}

// Save game state to Google Sheets
async function saveGameStateToSheet(lobbyCode, gameState) {
  try {
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells('A1:Z100');
    
    // Save game state data
    const data = {
      lobbyCode,
      gameState: JSON.stringify(gameState)
    };
    
    await sheet.setHeaderRow(['Lobby Code', 'Game State']);
    await sheet.addRow(data);
  } catch (error) {
    console.error('Error saving game state to sheet:', error);
    throw error;
  }
}

// Load game state from Google Sheets
async function loadGameStateFromSheet(lobbyCode) {
  try {
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadCells('A1:Z100');
    
    const rows = await sheet.getRows();
    const row = rows.find(r => r['Lobby Code'] === lobbyCode);
    
    if (!row) {
      throw new Error('Lobby not found');
    }
    
    return JSON.parse(row['Game State']);
  } catch (error) {
    console.error('Error loading game state from sheet:', error);
    throw error;
  }
}

// Get game state
app.get('/api/game-state', async (req, res) => {
  try {
    const { lobbyCode } = req.query;
    
    if (lobbyCode) {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        return res.status(404).json({ error: 'Lobby not found' });
      }
      return res.json(lobby);
    }

    // Return default game state for solo mode
    res.json(initializeGameState());
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

// Save game state
app.post('/api/game-state', async (req, res) => {
  try {
    const { gameState, mode, lobbyCode } = req.body;
    
    if (mode === 'multiplayer') {
      if (lobbyCode === 'NEW') {
        const newLobbyCode = `LOBBY_${Date.now()}`;
        lobbies.set(newLobbyCode, gameState);
        await saveGameStateToSheet(newLobbyCode, gameState);
        res.json({ lobbyCode: newLobbyCode });
      } else {
        lobbies.set(lobbyCode, gameState);
        await saveGameStateToSheet(lobbyCode, gameState);
        res.json({ success: true });
      }
    } else {
      // For solo mode, just return success
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Error saving game state:', error);
    res.status(500).json({ error: 'Failed to save game state' });
  }
});

app.post('/api/game-state/create-lobby', async (req, res) => {
  try {
    const newLobbyCode = `LOBBY_${Date.now()}`;
    const gameState = initializeGameState();
    lobbies.set(newLobbyCode, gameState);
    await saveGameStateToSheet(newLobbyCode, gameState);
    res.json({ lobbyCode: newLobbyCode });
  } catch (error) {
    console.error('Error creating lobby:', error);
    res.status(500).json({ error: 'Failed to create lobby' });
  }
});

app.get('/api/game-state/join-lobby', async (req, res) => {
  try {
    const { lobbyCode } = req.query;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    res.json(lobby);
  } catch (error) {
    console.error('Error joining lobby:', error);
    res.status(500).json({ error: 'Failed to join lobby' });
  }
});

app.put('/api/game-state/update-player', async (req, res) => {
  try {
    const { lobbyCode, playerId, updates } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    Object.assign(player, updates);
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

app.post('/api/game-state/add-task', async (req, res) => {
  try {
    const { lobbyCode, playerId, task } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    player.tasks.push(task);
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add task' });
  }
});

app.put('/api/game-state/complete-task', async (req, res) => {
  try {
    const { lobbyCode, playerId, taskId } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const task = player.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.completed = true;
    player.score += task.points;
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

app.post('/api/game-state/add-subtask', async (req, res) => {
  try {
    const { lobbyCode, playerId, taskId, subtask } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const task = player.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task.subtasks.push(subtask);
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding subtask:', error);
    res.status(500).json({ error: 'Failed to add subtask' });
  }
});

app.put('/api/game-state/complete-subtask', async (req, res) => {
  try {
    const { lobbyCode, playerId, taskId, subtaskId } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const task = player.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    subtask.completed = true;
    // Check if all subtasks are complete
    const allSubtasksComplete = task.subtasks.every(s => s.completed);
    if (allSubtasksComplete) {
      task.completed = true;
      player.score += task.points;
    }
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing subtask:', error);
    res.status(500).json({ error: 'Failed to complete subtask' });
  }
});

app.put('/api/game-state/update-task', async (req, res) => {
  try {
    const { lobbyCode, playerId, taskId, updates } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const task = player.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    Object.assign(task, updates);
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.put('/api/game-state/update-subtask', async (req, res) => {
  try {
    const { lobbyCode, playerId, taskId, subtaskId, updates } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const task = player.tasks.find(t => t.id === taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }
    
    Object.assign(subtask, updates);
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

app.get('/api/game-state/status', async (req, res) => {
  try {
    const { lobbyCode } = req.query;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    res.json({
      players: lobby.players.length,
      currentPhase: lobby.currentPhase,
      timeRemaining: lobby.timeRemaining
    });
  } catch (error) {
    console.error('Error getting lobby status:', error);
    res.status(500).json({ error: 'Failed to get lobby status' });
  }
});

app.put('/api/game-state/settings', async (req, res) => {
  try {
    const { lobbyCode, settings } = req.body;
    const lobby = lobbies.get(lobbyCode);
    
    if (!lobby) {
      return res.status(404).json({ error: 'Lobby not found' });
    }
    
    lobby.settings = settings;
    await saveGameStateToSheet(lobbyCode, lobby);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Task Tower Server is running',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001,
        googleApi: {
            status: googleService.isConfigured ? 'configured' : 'not configured',
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            credentials: {
                projectId: process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS).project_id : null,
                clientId: process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS).client_id : null
            }
        }
    });
});

// API Routes
app.get('/api/sheets', async (req, res) => {
    try {
        if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SPREADSHEET_ID) {
            return res.status(400).json({
                error: 'Google credentials not configured',
                message: 'Please set GOOGLE_CREDENTIALS and SPREADSHEET_ID in your environment variables',
                requiredVariables: [
                    'GOOGLE_CREDENTIALS',
                    'GOOGLE_SPREADSHEET_ID'
                ]
            });
        }

        // Parse credentials
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const client = await auth.getClient();
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        const sheets = google.sheets({ version: 'v4' });
        
        // First get the sheet names
        const metadata = await sheets.spreadsheets.get({
            auth: client,
            spreadsheetId
        });

        const sheetNames = metadata.data.sheets.map(sheet => sheet.properties.title);

        // Get the first sheet's data
        const firstSheetName = sheetNames[0];
        if (!firstSheetName) {
            return res.status(404).json({
                error: 'No sheets found in the spreadsheet',
                metadata: metadata.data
            });
        }

        const response = await sheets.spreadsheets.values.get({
            auth: client,
            spreadsheetId,
            range: `${firstSheetName}!A1:Z`
        });

        res.json({
            sheetNames,
            data: response.data.values || []
        });
    } catch (error) {
        console.error('Error accessing Google Sheets:', error);
        res.status(500).json({ 
            error: 'Failed to access Google Sheets',
            details: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeSheets();
});
