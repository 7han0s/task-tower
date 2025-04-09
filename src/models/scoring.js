class Score {
    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.playerId = data.playerId;
        this.points = data.points || 0;
        this.completedTasks = data.completedTasks || [];
        this.multipliers = {
            streak: 1,
            category: 1,
            time: 1
        };
        this.streak = data.streak || 0;
        this.lastTaskTime = data.lastTaskTime;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    addPoints(points) {
        this.points += Math.round(points * this.getMultiplier());
        this.updatedAt = new Date();
        return this.points;
    }

    addTask(task) {
        this.completedTasks.push(task.id);
        this.updateStreak(task);
        this.updateMultipliers(task);
        return this;
    }

    updateStreak(task) {
        // Check if task was completed within streak time
        const now = new Date();
        const timeDiff = now - (this.lastTaskTime || now);
        const streakTime = 30 * 60 * 1000; // 30 minutes

        if (timeDiff <= streakTime) {
            this.streak++;
        } else {
            this.streak = 1;
        }

        this.lastTaskTime = now;
        this.multipliers.streak = this.streak * 0.1 + 1; // 10% bonus per streak
    }

    updateMultipliers(task) {
        // Category bonus
        const categoryBonuses = {
            'WORK': 1.5,
            'CHORES': 1.2,
            'PERSONAL': 1.1
        };
        this.multipliers.category = categoryBonuses[task.category] || 1;

        // Time bonus
        const now = new Date();
        const hour = now.getHours();
        const timeBonuses = {
            // Morning bonus
            6: 1.2,
            7: 1.2,
            8: 1.2,
            // Evening bonus
            17: 1.2,
            18: 1.2,
            19: 1.2
        };
        this.multipliers.time = timeBonuses[hour] || 1;
    }

    getMultiplier() {
        return Object.values(this.multipliers).reduce((acc, val) => acc * val, 1);
    }

    toJSON() {
        return {
            id: this.id,
            playerId: this.playerId,
            points: this.points,
            completedTasks: this.completedTasks,
            multipliers: this.multipliers,
            streak: this.streak,
            lastTaskTime: this.lastTaskTime,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        return new Score(data);
    }

    static create(data) {
        return new Score(data);
    }
}

module.exports = Score;
