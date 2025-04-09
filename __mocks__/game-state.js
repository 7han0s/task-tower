class GameState {
    constructor() {
        this.players = [];
        this.currentPlayerCount = 0;
        this.currentRound = 1;
        this.totalRounds = 20;
        this.currentPhase = 'setup';
        this.phaseTimeRemaining = 0;
        this.nextPlayerId = 1;
        this.nextTaskId = 1;
        this.actionsTakenThisRound = {};
        this.config = {
            maxPlayers: 8,
            maxRounds: 20,
            roundTime: 25,
            breakTime: 5
        };
    }

    addPlayer(player) {
        const newPlayer = {
            ...player,
            id: this.nextPlayerId++,
            score: 0,
            tasks: [],
            joinedAt: new Date().toISOString()
        };
        this.players.push(newPlayer);
        this.currentPlayerCount++;
        return newPlayer;
    }

    removePlayer(playerId) {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index > -1) {
            this.players.splice(index, 1);
            this.currentPlayerCount--;
            return true;
        }
        return false;
    }

    updatePlayer(playerId, updates) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            Object.assign(player, updates);
            return player;
        }
        return null;
    }

    getPlayerById(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    getPlayers() {
        return [...this.players];
    }

    addTask(task) {
        const newTask = {
            ...task,
            id: this.nextTaskId++,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        return newTask;
    }

    updateTask(taskId, updates) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            Object.assign(task, updates);
            return task;
        }
        return null;
    }

    removeTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index > -1) {
            this.tasks.splice(index, 1);
            return true;
        }
        return false;
    }

    getTaskById(taskId) {
        return this.tasks.find(t => t.id === taskId);
    }

    getTasks() {
        return [...this.tasks];
    }

    startRound() {
        this.currentRound++;
        this.currentPhase = 'work';
        this.phaseTimeRemaining = this.config.roundTime * 60;
    }

    endRound() {
        this.currentPhase = 'break';
        this.phaseTimeRemaining = this.config.breakTime * 60;
    }

    endGame() {
        this.currentPhase = 'game-over';
        this.phaseTimeRemaining = 0;
    }

    resetGame() {
        this.players = [];
        this.currentPlayerCount = 0;
        this.currentRound = 1;
        this.currentPhase = 'setup';
        this.phaseTimeRemaining = 0;
        this.nextPlayerId = 1;
        this.nextTaskId = 1;
        this.actionsTakenThisRound = {};
    }

    update() {
        if (this.phaseTimeRemaining > 0) {
            this.phaseTimeRemaining--;
        }

        if (this.phaseTimeRemaining === 0) {
            if (this.currentPhase === 'work') {
                this.endRound();
            } else if (this.currentPhase === 'break') {
                if (this.currentRound < this.totalRounds) {
                    this.startRound();
                } else {
                    this.endGame();
                }
            }
        }
    }
}

module.exports = GameState;
