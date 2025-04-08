import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the root directory
app.use(express.static(__dirname));

// Initialize multiplayer manager
import { multiplayerManager } from './scripts/core/multiplayer-manager.js';
multiplayerManager.initialize(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
