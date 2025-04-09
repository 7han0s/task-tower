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
            throw new Error('No game state found');
        }

        // Get player data
        const playerData = await googleService.getSheetData(spreadsheetId, 'Player Data!A2:E');
        if (!playerData) {
            throw new Error('No player data found');
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

module.exports = router;
