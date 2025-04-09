class Task {
    static COMPLEXITY = {
        EASY: 'EASY',
        MODERATE: 'MODERATE',
        HARD: 'HARD'
    };

    static STATUS = {
        PENDING: 'PENDING',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED'
    };

    static CATEGORY = {
        PERSONAL: 'PERSONAL',
        CHORES: 'CHORES',
        WORK: 'WORK'
    };

    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.title = data.title || '';
        this.description = data.description || '';
        this.category = data.category || Task.CATEGORY.PERSONAL;
        this.complexity = data.complexity || Task.COMPLEXITY.EASY;
        this.points = this.calculatePoints();
        this.status = data.status || Task.STATUS.PENDING;
        this.createdAt = data.createdAt || new Date();
        this.completedAt = data.completedAt;
        this.assignedTo = data.assignedTo;
    }

    calculatePoints() {
        let basePoints = 0;
        switch(this.category) {
            case Task.CATEGORY.PERSONAL: basePoints = 1; break;
            case Task.CATEGORY.CHORES: basePoints = 2; break;
            case Task.CATEGORY.WORK: basePoints = 3; break;
        }

        let complexityMultiplier = 1;
        switch(this.complexity) {
            case Task.COMPLEXITY.EASY: complexityMultiplier = 1; break;
            case Task.COMPLEXITY.MODERATE: complexityMultiplier = 1.5; break;
            case Task.COMPLEXITY.HARD: complexityMultiplier = 2; break;
        }

        return Math.round(basePoints * complexityMultiplier);
    }

    markAsInProgress() {
        this.status = Task.STATUS.IN_PROGRESS;
        return this;
    }

    markAsCompleted() {
        this.status = Task.STATUS.COMPLETED;
        this.completedAt = new Date();
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            category: this.category,
            complexity: this.complexity,
            points: this.points,
            status: this.status,
            createdAt: this.createdAt,
            completedAt: this.completedAt,
            assignedTo: this.assignedTo
        };
    }

    static fromJSON(data) {
        return new Task(data);
    }

    static create(data) {
        return new Task(data);
    }
}

module.exports = Task;
