const { v4: uuidv4 } = require('uuid');

class Player {
    static STATUS = {
        ONLINE: 'ONLINE',
        OFFLINE: 'OFFLINE',
        IN_GAME: 'IN_GAME',
        AWAY: 'AWAY'
    };

    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.gameId = data.gameId;
        this.name = data.name || '';
        this.email = data.email;
        this.status = data.status || Player.STATUS.OFFLINE;
        this.score = data.score || 0;
        this.tasks = data.tasks || new Map();
        this.lastActive = data.lastActive || new Date();
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    updateStatus(status) {
        this.status = status;
        this.lastActive = new Date();
        this.updatedAt = new Date();
        return this;
    }

    addTask(taskId, taskData) {
        this.tasks.set(taskId, taskData);
        this.updatedAt = new Date();
        return this;
    }

    removeTask(taskId) {
        this.tasks.delete(taskId);
        this.updatedAt = new Date();
        return this;
    }

    updateTask(taskId, updates) {
        const task = this.tasks.get(taskId);
        if (task) {
            this.tasks.set(taskId, { ...task, ...updates });
            this.updatedAt = new Date();
        }
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            gameId: this.gameId,
            name: this.name,
            email: this.email,
            status: this.status,
            score: this.score,
            tasks: Object.fromEntries(this.tasks),
            lastActive: this.lastActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        return new Player(data);
    }

    static create(data) {
        return new Player(data);
    }
}

module.exports = Player;
