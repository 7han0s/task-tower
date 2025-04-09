class TaskManager {
    constructor() {
        this.tasks = [];
    }

    addTask(task) {
        const newTask = {
            ...task,
            id: task.id || Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.tasks.push(newTask);
        return newTask;
    }

    updateTask(id, updates) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) {
            throw new Error(`Task ${id} not found`);
        }

        Object.assign(task, updates);
        task.updatedAt = new Date().toISOString();
        return task;
    }

    removeTask(id) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index > -1) {
            this.tasks.splice(index, 1);
            return true;
        }
        return false;
    }

    getTasks() {
        return [...this.tasks];
    }

    getTaskById(id) {
        return this.tasks.find(t => t.id === id);
    }

    validateTask(task) {
        if (!task.description) {
            throw new Error('Task must have a description');
        }
        if (!task.category) {
            throw new Error('Task must have a category');
        }
        if (!task.complexity) {
            throw new Error('Task must have a complexity level');
        }
        return true;
    }

    calculateProgress(task) {
        if (!task.subtasks) return 0;
        const completed = task.subtasks.filter(s => s.completed).length;
        return (completed / task.subtasks.length) * 100;
    }

    getTasksByPlayer(playerId) {
        return this.tasks.filter(task => task.playerId === playerId);
    }

    getIncompleteTasks() {
        return this.tasks.filter(task => task.status !== 'completed');
    }

    getCompletedTasks() {
        return this.tasks.filter(task => task.status === 'completed');
    }

    getTasksByCategory(category) {
        return this.tasks.filter(task => task.category === category);
    }

    getTasksByComplexity(complexity) {
        return this.tasks.filter(task => task.complexity === complexity);
    }
}

module.exports = TaskManager;
