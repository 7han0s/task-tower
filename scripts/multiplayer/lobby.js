/**
 * lobby.js
 * Handles lobby creation and joining for multiplayer functionality
 */

const LobbyManager = (function() {
    // Private variables
    let currentLobbyCode = null;
    let isHost = false;
    let connectedPlayers = [];
    let isOnlineMode = false;
    let googleSheetId = null;
    let googleSheetUrl = null;
    
    // Generate a random lobby code
    function generateLobbyCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    // Initialize lobby mode
    function initLobbyMode(isOnline) {
        isOnlineMode = isOnline;
        if (isOnline) {
            console.log('Initializing online lobby mode with Google Sheets');
            // Initialize Google Sheets connection
            // This would be implemented with Google Apps Script
            if (typeof gapi !== 'undefined') {
                gapi.load('client:auth2', initGoogleApi);
            }
        }
    }
    
    // Initialize Google API
    function initGoogleApi() {
        gapi.client.init({
            apiKey: 'AIzaSyDXpsk3DMFgNX9WUClhNdxLdIlpMU8xjf4', // Replace with actual API key
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            clientId: '901429844489-ssldugsf30g74msd5pg0if3kccad81o4.apps.googleusercontent.com', // Replace with actual client ID
            scope: 'https://www.googleapis.com/auth/spreadsheets'
        }).then(() => {
            console.log('Google API initialized');
        });
    }
    
    // Create Google Sheet
    async function createGoogleSheet() {
        try {
            const result = await gapi.client.sheets.spreadsheets.create({
                properties: {
                    title: `Task Tower Lobby - ${currentLobbyCode}`
                }
            });
            
            googleSheetId = result.result.spreadsheetId;
            googleSheetUrl = result.result.spreadsheetUrl;
            
            // Set up initial sheet structure
            await setupSheetStructure();
            
            return {
                success: true,
                sheetId: googleSheetId,
                sheetUrl: googleSheetUrl
            };
        } catch (error) {
            console.error('Error creating Google Sheet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Set up sheet structure
    async function setupSheetStructure() {
        try {
            const batchUpdate = {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: 'Game State',
                                index: 0
                            }
                        }
                    },
                    {
                        addSheet: {
                            properties: {
                                title: 'Player Data',
                                index: 1
                            }
                        }
                    }
                ]
            };
            
            await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: googleSheetId,
                resource: batchUpdate
            });
            
            // Initialize sheet headers
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: googleSheetId,
                range: 'Game State!A1:D1',
                valueInputOption: 'RAW',
                resource: {
                    values: [['Lobby Code', 'Current Phase', 'Round Number', 'Timer']]
                }
            });
            
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: googleSheetId,
                range: 'Player Data!A1:D1',
                valueInputOption: 'RAW',
                resource: {
                    values: [['Player ID', 'Name', 'Score', 'Current Tasks']]
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error setting up sheet structure:', error);
            return false;
        }
    }
    
    // Public API
    return {
        // Initialize lobby system
        init: function(isOnline) {
            initLobbyMode(isOnline);
            return {
                isOnline: isOnline
            };
        },

        // Create a new lobby and become host
        createLobby: async function() {
            currentLobbyCode = generateLobbyCode();
            isHost = true;
            connectedPlayers = [];
            
            if (isOnlineMode) {
                const sheetResult = await createGoogleSheet();
                if (!sheetResult.success) {
                    console.error('Failed to create Google Sheet:', sheetResult.error);
                    return {
                        success: false,
                        error: sheetResult.error
                    };
                }
            }
            
            console.log(`Created ${isOnlineMode ? 'online' : 'local'} lobby with code: ${currentLobbyCode}`);
            return {
                success: true,
                code: currentLobbyCode,
                isHost: true,
                isOnline: isOnlineMode,
                sheetUrl: isOnlineMode ? googleSheetUrl : null
            };
        },
        
        // Join an existing lobby
        joinLobby: function(code) {
            if (!code || typeof code !== 'string') {
                console.error('Invalid lobby code');
                return {
                    success: false,
                    error: 'Invalid lobby code'
                };
            }
            
            currentLobbyCode = code.toUpperCase();
            isHost = false;
            
            if (isOnlineMode) {
                // In online mode, connect to Google Sheet
                // This would be implemented with Google Apps Script
                console.log('Connecting to Google Sheet for online lobby');
            }
            
            console.log(`Joined ${isOnlineMode ? 'online' : 'local'} lobby with code: ${currentLobbyCode}`);
            return {
                success: true,
                code: currentLobbyCode,
                isHost: false,
                isOnline: isOnlineMode
            };
        },
        
        // Leave the current lobby
        leaveLobby: function() {
            const wasInLobby = !!currentLobbyCode;
            currentLobbyCode = null;
            isHost = false;
            connectedPlayers = [];
            
            if (isOnlineMode) {
                // In online mode, disconnect from Google Sheet
                // This would be implemented with Google Apps Script
                console.log('Disconnecting from Google Sheet');
            }
            
            return {
                success: true,
                wasInLobby: wasInLobby
            };
        },
        
        // Get current lobby information
        getLobbyInfo: function() {
            if (!currentLobbyCode) return null;
            
            return {
                code: currentLobbyCode,
                isHost: isHost,
                playerCount: connectedPlayers.length + 1, // +1 for self
                isOnline: isOnlineMode,
                sheetUrl: isOnlineMode ? googleSheetUrl : null
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
            return googleSheetUrl;
        }
    };
})();

// Export to window scope
window.LobbyManager = LobbyManager;
