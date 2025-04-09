/**
 * sync.js
 * Handles state synchronization between players in multiplayer mode
 */

const SyncManager = (function() {
    // Private variables
    let isConnected = false;
    let syncInterval = null;
    const SYNC_INTERVAL_MS = 5000; // How often to check for updates
    let isOnlineMode = false;
    let googleSheetId = null;
    let sheetUrl = null;
    let currentGameState = null;
    
    // Initialize Google API
    function initGoogleApi() {
        if (typeof gapi !== 'undefined') {
            gapi.load('client:auth2', () => {
                console.log('Google API client loaded');
                gapi.client.init({
                    apiKey: 'AIzaSyDXpsk3DMFgNX9WUClhNdxLdIlpMU8xjf4',
                    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
                    clientId: '901429844489-ssldugsf30g74msd5pg0if3kccad81o4.apps.googleusercontent.com',
                    scope: 'https://www.googleapis.com/auth/spreadsheets'
                }).then(() => {
                    console.log('Google API initialized');
                });
            });
        }
    }
    
    // Save game state to Google Sheet
    async function saveGameStateToSheet(gameState) {
        try {
            // Update game state sheet
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
            
            // Update player data
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
    
    // Load game state from Google Sheet
    async function loadGameStateFromSheet() {
        try {
            // Get game state
            const gameStateResponse = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: googleSheetId,
                range: 'Game State!A2:D2'
            });
            
            // Get player data
            const playerDataResponse = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: googleSheetId,
                range: 'Player Data!A2:D'
            });
            
            const gameState = {
                lobbyCode: gameStateResponse.result.values[0][0],
                currentPhase: gameStateResponse.result.values[0][1],
                currentRound: parseInt(gameStateResponse.result.values[0][2]),
                timer: parseInt(gameStateResponse.result.values[0][3]),
                players: playerDataResponse.result.values.map(row => ({
                    id: parseInt(row[0]),
                    name: row[1],
                    score: parseInt(row[2]),
                    pendingTasks: JSON.parse(row[3])
                }))
            };
            
            return gameState;
        } catch (error) {
            console.error('Error loading game state:', error);
            return null;
        }
    }
    
    // Sync game state with Google Sheets
    async function syncGameState(gameState) {
        if (!isOnlineMode) {
            console.log('Syncing locally...');
            currentGameState = gameState;
            return Promise.resolve({ success: true });
        }
        
        try {
            if (await saveGameStateToSheet(gameState)) {
                console.log('Game state synced successfully');
                return Promise.resolve({ success: true });
            } else {
                console.error('Failed to sync game state');
                return Promise.resolve({ success: false });
            }
        } catch (error) {
            console.error('Error syncing game state:', error);
            return Promise.resolve({ success: false });
        }
    }
    
    // Fetch latest state from Google Sheets
    async function fetchLatestState() {
        if (!isOnlineMode) {
            console.log('Fetching local state...');
            return currentGameState;
        }
        
        try {
            const newState = await loadGameStateFromSheet();
            if (newState) {
                console.log('Received updated game state from Google Sheets');
                return newState;
            }
            return null;
        } catch (error) {
            console.error('Error fetching game state:', error);
            return null;
        }
    }
    
    // Public API
    return {
        // Initialize sync system
        init: function(isOnline) {
            isOnlineMode = isOnline;
            if (isOnline) {
                initGoogleApi();
            }
            return {
                isOnline: isOnline
            };
        },

        // Set Google Sheet ID (for online mode)
        setGoogleSheetId: function(sheetId) {
            if (!isOnlineMode) {
                console.warn('Attempted to set Google Sheet ID in local mode');
                return false;
            }
            googleSheetId = sheetId;
            return true;
        },

        // Get Google Sheet ID (for online mode)
        getGoogleSheetId: function() {
            return googleSheetId;
        },

        // Get Google Sheet URL (for online mode)
        getGoogleSheetUrl: function() {
            return sheetUrl;
        },

        // Start synchronization process
        startSync: function(gameStateProvider) {
            if (syncInterval) {
                console.warn('Sync already running');
                return false;
            }
            
            isConnected = true;
            
            // Set up regular syncing
            syncInterval = setInterval(async () => {
                if (!isConnected) return;
                
                try {
                    // Get current game state from provider function
                    const currentState = gameStateProvider();
                    
                    // Save current state
                    await syncGameState(currentState);
                    
                    // Check for updates
                    const newState = await fetchLatestState();
                    if (newState && JSON.stringify(newState) !== JSON.stringify(currentState)) {
                        console.log('Received updated game state');
                        // Trigger UI updates
                        if (typeof window.GameCore !== 'undefined') {
                            window.GameCore.updateGameState(newState);
                        }
                    }
                } catch (error) {
                    console.error('Sync error:', error);
                }
            }, SYNC_INTERVAL_MS);
            
            return true;
        },
        
        // Stop synchronization
        stopSync: function() {
            if (syncInterval) {
                clearInterval(syncInterval);
                syncInterval = null;
            }
            isConnected = false;
            console.log('Sync stopped');
            return true;
        },
        
        // Check if currently syncing
        isSyncing: function() {
            return !!syncInterval;
        }
    };
})();

// Export to window scope
window.SyncManager = SyncManager;
