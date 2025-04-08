/**
 * task-manager.js
 * Handles task creation, management, and tracking
 */

// Task ID counter (using a closure to keep it private)
const getNextTaskId = (function() {
    let taskIdCounter = 1;
    return function() {
        return taskIdCounter++;
    };
})();

// Task object structure
class Task {
    constructor({
        description,
        category = 'personal',
        playerId,
        estimatedDuration = null,
        isBigTask = false
    }) {
        this.id = getNextTaskId();
        this.description = description;
        this.category = category;
        this.playerId = playerId;
        this.estimatedDuration = estimatedDuration; // in minutes
        this.actualDuration = null;
        this.isBigTask = isBigTask; // Tasks marked with "!!" spanning multiple sessions
        this.created = new Date();
        this.completed = null;
        this.subtasks = [];
        this.points = this.calculatePoints();
    }

    /**
     * Calculate base points for a task based on category and complexity
     */
    calculatePoints() {
        const categoryPoints = GameCore.pointsPerCategory[this.category] || 1;
        // Big tasks get a 50% bonus
        return this.isBigTask ? Math.ceil(categoryPoints * 1.5) : categoryPoints;
    }

    /**
     * Add a subtask to this task
     */
    addSubtask(description, estimatedDuration = null) {
        const subtask = {
            id: `${this.id}-sub-${this.subtasks.length + 1}`,
            description,
            estimatedDuration,
            completed: false,
            startTime: null,
            endTime: null
        };
        this.subtasks.push(subtask);
        return subtask;
    }

    /**
     * Complete a subtask
     */
    completeSubtask(subtaskId) {
        const subtask = this.subtasks.find(st => st.id === subtaskId);
        if (subtask) {
            subtask.completed = true;
            subtask.endTime = new Date();
            return true;
        }
        return false;
    }

    /**
     * Mark the task as completed
     */
    complete() {
        this.completed = new Date();
        if (this.estimatedDuration) {
            // Calculate actual duration in minutes
            const durationMs = this.completed - this.created;
            this.actualDuration = Math.ceil(durationMs / (1000 * 60));
        }
        return this.calculateFinalScore();
    }

    /**
     * Calculate final score including efficiency bonuses
     */
    calculateFinalScore() {
        let finalScore = this.points;
        
        // Add efficiency bonus if applicable
        if (this.estimatedDuration && this.actualDuration) {
            const timeSaved = this.estimatedDuration - this.actualDuration;
            if (timeSaved > 0) {
                // 10% bonus for each minute saved, up to 50%
                const efficiencyBonus = Math.min(0.5, (timeSaved / this.estimatedDuration) * 0.5);
                finalScore = Math.ceil(finalScore * (1 + efficiencyBonus));
            }
        }
        
        return finalScore;
    }
}

// Main Task Manager
const TaskManager = {
    /**
     * Create a new task for a player
     */
    createTask(taskData) {
        const task = new Task(taskData);
        
        // Add to player's pending tasks
        const player = GameCore.players.find(p => p.id === taskData.playerId);
        if (player) {
            player.pendingTasks.push(task);
            console.log(`Task created for Player ${taskData.playerId}:`, task);
            return task;
        }
        return null;
    },

    /**
     * Complete a task
     */
    completeTask(playerId, taskId) {
        const player = GameCore.players.find(p => p.id === playerId);
        if (!player) return null;

        const taskIndex = player.pendingTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return null;

        const task = player.pendingTasks[taskIndex];
        const finalScore = task.complete();
        
        // Calculate additional points if applicable
        const basePoints = task.points;
        const bonusPoints = finalScore - basePoints;
        
        console.log(`Task completed with ${finalScore} points (${basePoints} base + ${bonusPoints} bonus)`);
        
        return {
            task,
            finalScore,
            basePoints,
            bonusPoints
        };
    },

    /**
     * Get all tasks for a player
     */
    getPlayerTasks(playerId) {
        const player = GameCore.players.find(p => p.id === playerId);
        return player ? player.pendingTasks : [];
    },

    /**
     * Add a simple task (convenience method)
     */
    addSimpleTask(playerId, description, category) {
        return this.createTask({
            description,
            category,
            playerId
        });
    },
    
    /**
     * Add a subtask to an existing task
     */
    addSubtaskToTask(taskId, description, estimatedDuration = null) {
        // Find the task across all players
        let targetTask = null;
        for (const player of GameCore.players) {
            const task = player.pendingTasks.find(t => t.id === taskId);
            if (task) {
                targetTask = task;
                break;
            }
        }
        
        if (!targetTask) {
            console.error(`Task with ID ${taskId} not found`);
            return null;
        }
        
        return targetTask.addSubtask(description, estimatedDuration);
    }
};

// Export the TaskManager for use in other modules
window.TaskManager = TaskManager;
