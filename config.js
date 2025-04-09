module.exports = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ],
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
    },
    game: {
        maxPlayers: 8,
        maxRounds: 20,
        roundTime: 25 * 60, // 25 minutes
        breakTime: 5 * 60, // 5 minutes
        initialScore: 0
    },
    storage: {
        backupInterval: 60 * 60 * 1000, // 1 hour
        maxBackups: 10
    }
};
