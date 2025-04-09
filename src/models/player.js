class Player {
    static STATUS = {
        ONLINE: 'ONLINE',
        OFFLINE: 'OFFLINE',
        IN_GAME: 'IN_GAME',
        AWAY: 'AWAY'
    };

    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.name = data.name || '';
        this.email = data.email;
        this.status = data.status || Player.STATUS.OFFLINE;
        this.score = data.score || 0;
        this.currentTask = data.currentTask;
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

    assignTask(task) {
        this.currentTask = task;
        this.updatedAt = new Date();
        return this;
    }

    clearTask() {
        this.currentTask = null;
        this.updatedAt = new Date();
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            status: this.status,
            score: this.score,
            currentTask: this.currentTask,
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
