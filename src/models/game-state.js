class GameState {
    static ROUND_STATUS = {
        WORK: 'WORK',
        BREAK: 'BREAK',
        ROUND_OVER: 'ROUND_OVER',
        GAME_OVER: 'GAME_OVER'
    };

    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.round = data.round || 0;
        this.phase = data.phase || GameState.ROUND_STATUS.WORK;
        this.startTime = data.startTime || new Date();
        this.endTime = data.endTime;
        this.duration = data.duration || 0;
        this.currentTask = data.currentTask;
        this.players = data.players || new Map();
        this.settings = data.settings || {
            maxPlayers: 8,
            maxRounds: 20,
            roundTime: 25,
            breakTime: 5,
            taskCategories: ['WORK', 'PERSONAL', 'CHORES'],
            complexityLevels: ['EASY', 'MODERATE', 'HARD']
        };
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    startRound() {
        this.round++;
        this.phase = GameState.ROUND_STATUS.WORK;
        this.startTime = new Date();
        this.duration = this.settings.roundTime * 60; // Convert minutes to seconds
        this.updatedAt = new Date();
        return this;
    }

    startBreak() {
        this.phase = GameState.ROUND_STATUS.BREAK;
        this.startTime = new Date();
        this.duration = this.settings.breakTime * 60; // Convert minutes to seconds
        this.updatedAt = new Date();
        return this;
    }

    endRound() {
        this.phase = GameState.ROUND_STATUS.ROUND_OVER;
        this.endTime = new Date();
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
        this.updatedAt = new Date();
        return this;
    }

    endGame() {
        this.phase = GameState.ROUND_STATUS.GAME_OVER;
        this.endTime = new Date();
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
        this.updatedAt = new Date();
        return this;
    }

    addPlayer(playerId, playerData) {
        this.players.set(playerId, playerData);
        this.updatedAt = new Date();
        return this;
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.updatedAt = new Date();
        return this;
    }

    updatePlayer(playerId, updates) {
        const player = this.players.get(playerId);
        if (player) {
            this.players.set(playerId, { ...player, ...updates });
            this.updatedAt = new Date();
        }
        return this;
    }

    getCurrentTask() {
        return this.currentTask;
    }

    setCurrentTask(task) {
        this.currentTask = task;
        this.updatedAt = new Date();
        return this;
    }

    isRoundActive() {
        return this.phase === GameState.ROUND_STATUS.WORK;
    }

    isBreakActive() {
        return this.phase === GameState.ROUND_STATUS.BREAK;
    }

    isRoundOver() {
        return this.phase === GameState.ROUND_STATUS.ROUND_OVER;
    }

    isGameOver() {
        return this.phase === GameState.ROUND_STATUS.GAME_OVER;
    }

    getTimeRemaining() {
        if (!this.startTime) return 0;
        const elapsed = Math.floor((new Date() - this.startTime) / 1000);
        return Math.max(0, this.duration - elapsed);
    }

    toJSON() {
        return {
            id: this.id,
            round: this.round,
            phase: this.phase,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this.duration,
            currentTask: this.currentTask,
            players: Object.fromEntries(this.players),
            settings: this.settings,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        return new GameState(data);
    }

    static create(data) {
        return new GameState(data);
    }
}

module.exports = GameState;
