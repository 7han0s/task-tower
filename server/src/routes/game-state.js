/**
 * game-state.js
 * Routes for game state management
 */

const express = require('express');
const router = express.Router();
const { googleService } = require('../google-service');

/**
 * Get game state
 */
router.get('/', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        
        // Get game state
        const gameStateData = await googleService.getSheetData(spreadsheetId, 'Game State!A2:E2');
        if (!gameStateData || gameStateData.length === 0) {
            // Return default empty state if no data exists
            return res.json({
                lobbyCode: '',
                currentPhase: '',
                currentRound: 0,
                timer: 0,
                playerCount: 0,
                players: []
            });
        }

        // Get player data
        const playerData = await googleService.getSheetData(spreadsheetId, 'Player Data!A2:E');
        if (!playerData) {
            return res.json({
                lobbyCode: gameStateData[0][0],
                currentPhase: gameStateData[0][1],
                currentRound: gameStateData[0][2],
                timer: gameStateData[0][3],
                playerCount: gameStateData[0][4],
                players: []
            });
        }

        // Parse player data
        const players = playerData.map(row => ({
            id: row[0],
            name: row[1],
            score: row[2],
            tasks: JSON.parse(row[3]),
            towerBlocks: JSON.parse(row[4])
        }));

        res.json({
            lobbyCode: gameStateData[0][0],
            currentPhase: gameStateData[0][1],
            currentRound: gameStateData[0][2],
            timer: gameStateData[0][3],
            playerCount: gameStateData[0][4],
            players: players
        });
    } catch (error) {
        console.error('Error getting game state:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update game state
 */
router.post('/', async (req, res) => {
    try {
        const { gameState } = req.body;
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        // Update game state
        await googleService.updateSheetData(spreadsheetId, 'Game State!A2:E2', [
            [
                gameState.lobbyCode,
                gameState.currentPhase,
                gameState.currentRound,
                gameState.timer,
                gameState.playerCount
            ]
        ]);

        // Update player data
        const playerData = gameState.players.map(player => [
            player.id,
            player.name,
            player.score,
            JSON.stringify(player.tasks),
            JSON.stringify(player.towerBlocks)
        ]);

        // Clear existing data and add new data
        await googleService.clearSheetData(spreadsheetId, 'Player Data!A2:E');
        await googleService.updateSheetData(spreadsheetId, 'Player Data!A2:E', playerData);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating game state:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Pause game
 */
router.post('/pause', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        const { playerId, reason } = req.body;

        // Get current game state
        const gameStateData = await googleService.getSheetData(spreadsheetId, 'Game State!A2:E2');
        if (!gameStateData || gameStateData.length === 0) {
            throw new Error('No game state found');
        }

        // Update game state with pause info
        const updatedState = {
            lobbyCode: gameStateData[0][0],
            currentPhase: 'paused',
            currentRound: gameStateData[0][2],
            timer: gameStateData[0][3],
            playerCount: gameStateData[0][4]
        };

        await googleService.updateSheetData(spreadsheetId, 'Game State!A2:E2', [
            [
                updatedState.lobbyCode,
                updatedState.currentPhase,
                updatedState.currentRound,
                updatedState.timer,
                updatedState.playerCount
            ]
        ]);

        // Add pause reason to player's data
        const playerData = await googleService.getSheetData(spreadsheetId, 'Player Data!A2:E');
        const updatedPlayers = playerData.map(row => {
            const player = {
                id: row[0],
                name: row[1],
                score: row[2],
                tasks: JSON.parse(row[3]),
                towerBlocks: JSON.parse(row[4])
            };

            if (player.id === playerId) {
                player.tasks.push(`Game paused: ${reason}`);
            }

            return [
                player.id,
                player.name,
                player.score,
                JSON.stringify(player.tasks),
                JSON.stringify(player.towerBlocks)
            ];
        });

        // Update player data
        await googleService.clearSheetData(spreadsheetId, 'Player Data!A2:E');
        await googleService.updateSheetData(spreadsheetId, 'Player Data!A2:E', updatedPlayers);

        res.json({ success: true, message: 'Game paused successfully' });
    } catch (error) {
        console.error('Error pausing game:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Resume game
 */
router.post('/resume', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        // Get current game state
        const gameStateData = await googleService.getSheetData(spreadsheetId, 'Game State!A2:E2');
        if (!gameStateData || gameStateData.length === 0) {
            throw new Error('No game state found');
        }

        // Update game state to resume
        const updatedState = {
            lobbyCode: gameStateData[0][0],
            currentPhase: gameStateData[0][1] === 'paused' ? 'work' : gameStateData[0][1],
            currentRound: gameStateData[0][2],
            timer: gameStateData[0][3],
            playerCount: gameStateData[0][4]
        };

        await googleService.updateSheetData(spreadsheetId, 'Game State!A2:E2', [
            [
                updatedState.lobbyCode,
                updatedState.currentPhase,
                updatedState.currentRound,
                updatedState.timer,
                updatedState.playerCount
            ]
        ]);

        res.json({ success: true, message: 'Game resumed successfully' });
    } catch (error) {
        console.error('Error resuming game:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Reset game
 */
router.post('/reset', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        const { lobbyCode } = req.body;

        // Reset game state
        const resetState = {
            lobbyCode,
            currentPhase: '',
            currentRound: 0,
            timer: 0,
            playerCount: 0
        };

        await googleService.updateSheetData(spreadsheetId, 'Game State!A2:E2', [
            [
                resetState.lobbyCode,
                resetState.currentPhase,
                resetState.currentRound,
                resetState.timer,
                resetState.playerCount
            ]
        ]);

        // Clear player data
        await googleService.clearSheetData(spreadsheetId, 'Player Data!A2:E');

        res.json({ success: true, message: 'Game reset successfully' });
    } catch (error) {
        console.error('Error resetting game:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Player actions
 */
router.post('/player/action', async (req, res) => {
    try {
        const { playerId, action, data } = req.body;
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        // Get current player data
        const playerData = await googleService.getSheetData(spreadsheetId, 'Player Data!A2:E');
        if (!playerData) {
            throw new Error('No player data found');
        }

        // Update player's data based on action
        const updatedPlayers = playerData.map(row => {
            const player = {
                id: row[0],
                name: row[1],
                score: row[2],
                tasks: JSON.parse(row[3]),
                towerBlocks: JSON.parse(row[4])
            };

            if (player.id === playerId) {
                switch (action) {
                    case 'complete-task':
                        player.tasks = player.tasks.filter(task => task !== data.task);
                        player.score += data.points;
                        break;
                    case 'add-block':
                        player.towerBlocks.push(data.block);
                        break;
                    case 'remove-block':
                        player.towerBlocks = player.towerBlocks.filter(block => block !== data.block);
                        break;
                }
            }

            return [
                player.id,
                player.name,
                player.score,
                JSON.stringify(player.tasks),
                JSON.stringify(player.towerBlocks)
            ];
        });

        // Update player data
        await googleService.clearSheetData(spreadsheetId, 'Player Data!A2:E');
        await googleService.updateSheetData(spreadsheetId, 'Player Data!A2:E', updatedPlayers);

        res.json({ success: true, message: 'Player action completed successfully' });
    } catch (error) {
        console.error('Error processing player action:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
