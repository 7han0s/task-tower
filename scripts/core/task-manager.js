/**
 * task-manager.js
 * Handles task creation, management, and tracking
 */

// Task priority levels
const TaskPriority = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4
};

// Task complexity levels
const TaskComplexity = {
    SIMPLE: 1,
    MODERATE: 2,
    COMPLEX: 3,
    VERY_COMPLEX: 4
};

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
        isBigTask = false,
        priority = TaskPriority.MEDIUM,
        complexity = TaskComplexity.MODERATE,
        dependencies = [],
        tags = [],
        deadline = null,
        notes = ''
    }) {
        this.id = getNextTaskId();
        this.description = description;
        this.category = category;
        this.playerId = playerId;
        this.estimatedDuration = estimatedDuration; // in minutes
        this.actualDuration = null;
        this.isBigTask = isBigTask; // Tasks marked with "!!" spanning multiple sessions
        this.priority = priority;
        this.complexity = complexity;
        this.dependencies = dependencies; // Array of task IDs this task depends on
        this.tags = tags;
        this.deadline = deadline;
        this.notes = notes;
        this.created = new Date();
        this.completed = null;
        this.subtasks = [];
        this.points = this.calculatePoints();
        this.progress = 0; // 0-100%
        this.status = 'pending'; // pending, in-progress, completed
        this.history = [];
    }

    /**
     * Calculate base points for a task based on multiple factors
     */
    calculatePoints() {
        const categoryPoints = GameCore.pointsPerCategory[this.category] || 1;
        
        // Base points calculation
        let basePoints = categoryPoints;
        
        // Complexity multiplier
        const complexityMultiplier = {
            [TaskComplexity.SIMPLE]: 1.0,
            [TaskComplexity.MODERATE]: 1.2,
            [TaskComplexity.COMPLEX]: 1.5,
            [TaskComplexity.VERY_COMPLEX]: 2.0
        }[this.complexity];
        
        // Priority bonus
        const priorityBonus = {
            [TaskPriority.LOW]: 0,
            [TaskPriority.MEDIUM]: 0.1,
            [TaskPriority.HIGH]: 0.2,
            [TaskPriority.CRITICAL]: 0.3
        }[this.priority];
        
        // Big task bonus
        const bigTaskBonus = this.isBigTask ? 0.5 : 0;
        
        // Calculate final base points
        basePoints = Math.ceil(basePoints * 
            (1 + complexityMultiplier + priorityBonus + bigTaskBonus)
        );
        
        return basePoints;
    }

    /**
     * Add a subtask to this task
     */
    addSubtask(description, estimatedDuration = null, complexity = TaskComplexity.MODERATE) {
        const subtask = {
            id: `${this.id}-sub-${this.subtasks.length + 1}`,
            description,
            estimatedDuration,
            complexity,
            completed: false,
            startTime: null,
            endTime: null,
            progress: 0
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
            this.updateProgress();
            return true;
        }
        return false;
    }

    /**
     * Update task progress based on completed subtasks
     */
    updateProgress() {
        const totalSubtasks = this.subtasks.length;
        const completedSubtasks = this.subtasks.filter(st => st.completed).length;
        this.progress = Math.round((completedSubtasks / totalSubtasks) * 100);
    }

    /**
     * Mark the task as completed
     */
    complete() {
        this.completed = new Date();
        this.status = 'completed';
        
        if (this.estimatedDuration) {
            // Calculate actual duration in minutes
            const durationMs = this.completed - this.created;
            this.actualDuration = Math.ceil(durationMs / (1000 * 60));
        }
        
        // Record completion in history
        this.history.push({
            type: 'completed',
            timestamp: new Date(),
            duration: this.actualDuration,
            points: this.points
        });
        
        return this.calculateFinalScore();
    }

    /**
     * Calculate final score including all bonuses
     */
    calculateFinalScore() {
        let finalScore = this.points;
        
        // Add efficiency bonus if applicable
        if (this.estimatedDuration && this.actualDuration) {
            const timeSaved = this.estimatedDuration - this.actualDuration;
            if (timeSaved > 0) {
                // 10% bonus for each minute saved, up to 50%
                const efficiencyBonus = Math.min(0.5, (timeSaved / this.estimatedDuration) * 0.5);
                finalScore *= (1 + efficiencyBonus);
            }
        }

        // Add complexity bonus
        const complexityBonus = {
            [TaskComplexity.SIMPLE]: 0,
            [TaskComplexity.MODERATE]: 0.1,
            [TaskComplexity.COMPLEX]: 0.2,
            [TaskComplexity.VERY_COMPLEX]: 0.3
        }[this.complexity];
        finalScore *= (1 + complexityBonus);

        // Add priority bonus
        const priorityBonus = {
            [TaskPriority.LOW]: 0,
            [TaskPriority.MEDIUM]: 0.1,
            [TaskPriority.HIGH]: 0.2,
            [TaskPriority.CRITICAL]: 0.3
        }[this.priority];
        finalScore *= (1 + priorityBonus);

        // Add deadline bonus if completed early
        if (this.deadline && this.completed < this.deadline) {
            const timeBeforeDeadline = Math.ceil((this.deadline - this.completed) / (1000 * 60));
            const deadlineBonus = Math.min(0.3, (timeBeforeDeadline / (this.deadline - this.created)) * 0.3);
            finalScore *= (1 + deadlineBonus);
        }

        // Add subtask completion bonus
        const subtaskBonus = (this.progress / 100) * 0.2;
        finalScore *= (1 + subtaskBonus);

        return Math.ceil(finalScore);
    }

    /**
     * Add a note to the task history
     */
    addNote(note) {
        this.history.push({
            type: 'note',
            timestamp: new Date(),
            content: note
        });
    }

    /**
     * Check if task can be started based on dependencies
     */
    canStart() {
        if (this.dependencies.length === 0) return true;
        
        // Check if all dependencies are completed
        return this.dependencies.every(depId => {
            const depTask = this.findTaskById(depId);
            return depTask && depTask.completed;
        });
    }

    /**
     * Find a task by ID (searches across all players)
     */
    findTaskById(taskId) {
        for (const player of GameCore.players) {
            const task = player.pendingTasks.find(t => t.id === taskId);
            if (task) return task;
        }
        return null;
    }

    /**
     * Add a dependency to this task
     * @param {number} dependencyId - ID of the task this task depends on
     * @returns {boolean} - True if dependency was added successfully
     */
    addDependency(dependencyId) {
        if (this.dependencies.includes(dependencyId)) {
            return false;
        }
        
        // Prevent circular dependencies
        const visited = new Set();
        if (this.checkCircularDependency(dependencyId, visited)) {
            throw new Error('Circular dependency detected');
        }
        
        this.dependencies.push(dependencyId);
        return true;
    }

    /**
     * Check for circular dependencies
     * @param {number} taskId - Task ID to check
     * @param {Set} visited - Set of visited task IDs
     * @returns {boolean} - True if circular dependency is found
     */
    checkCircularDependency(taskId, visited) {
        if (visited.has(taskId)) {
            return true;
        }
        
        visited.add(taskId);
        
        const task = TaskManager.getTaskById(taskId);
        if (!task) {
            return false;
        }
        
        for (const dep of task.dependencies) {
            if (this.checkCircularDependency(dep, visited)) {
                return true;
            }
        }
        
        visited.delete(taskId);
        return false;
    }

    /**
     * Remove a dependency from this task
     * @param {number} dependencyId - ID of the task to remove as dependency
     * @returns {boolean} - True if dependency was removed successfully
     */
    removeDependency(dependencyId) {
        const index = this.dependencies.indexOf(dependencyId);
        if (index === -1) {
            return false;
        }
        
        this.dependencies.splice(index, 1);
        return true;
    }

    /**
     * Get all dependent tasks (tasks that depend on this task)
     * @returns {Array<Task>} - Array of tasks that depend on this task
     */
    getDependentTasks() {
        const dependentTasks = [];
        for (const player of GameCore.players) {
            for (const task of player.pendingTasks) {
                if (task.dependencies.includes(this.id)) {
                    dependentTasks.push(task);
                }
            }
        }
        return dependentTasks;
    }

    /**
     * Get all prerequisites (tasks that this task depends on)
     * @returns {Array<Task>} - Array of prerequisite tasks
     */
    getPrerequisites() {
        const prerequisites = [];
        for (const depId of this.dependencies) {
            const task = TaskManager.getTaskById(depId);
            if (task) {
                prerequisites.push(task);
            }
        }
        return prerequisites;
    }

    /**
     * Check if all prerequisites are completed
     * @returns {boolean} - True if all prerequisites are completed
     */
    arePrerequisitesCompleted() {
        return this.dependencies.every(depId => {
            const task = TaskManager.getTaskById(depId);
            return task && task.completed;
        });
    }
}

// Main Task Manager
const TaskManager = {
    /**
     * Create a new task for a player
     */
    createTask(taskData) {
        try {
            const task = new Task(taskData);
            
            // Validate task creation
            if (!taskData.playerId) {
                throw new Error('Player ID is required');
            }

            if (!taskData.description) {
                throw new Error('Task description is required');
            }

            if (taskData.estimatedDuration && taskData.estimatedDuration < 1) {
                throw new Error('Estimated duration must be at least 1 minute');
            }

            // Add to player's pending tasks
            const player = GameCore.players.find(p => p.id === taskData.playerId);
            if (player) {
                player.pendingTasks.push(task);
                console.log(`Task created for Player ${taskData.playerId}:`, task);
                return task;
            }
            throw new Error(`Player with ID ${taskData.playerId} not found`);
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    },

    /**
     * Complete a task
     */
    completeTask(playerId, taskId) {
        try {
            const player = GameCore.players.find(p => p.id === playerId);
            if (!player) {
                throw new Error(`Player with ID ${playerId} not found`);
            }

            const taskIndex = player.pendingTasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) {
                throw new Error(`Task with ID ${taskId} not found`);
            }

            const task = player.pendingTasks[taskIndex];
            
            // Check if task can be completed
            if (!task.canStart()) {
                throw new Error('Cannot complete task - dependencies not met');
            }

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
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
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
    addSubtaskToTask(taskId, description, estimatedDuration = null, complexity = TaskComplexity.MODERATE) {
        try {
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
                throw new Error(`Task with ID ${taskId} not found`);
            }
            
            return targetTask.addSubtask(description, estimatedDuration, complexity);
        } catch (error) {
            console.error('Error adding subtask:', error);
            throw error;
        }
    },

    /**
     * Add a note to a task
     */
    addNoteToTask(taskId, note) {
        const task = this.findTaskById(taskId);
        if (task) {
            task.addNote(note);
            return true;
        }
        return false;
    },

    /**
     * Get task by ID (searches across all players)
     */
    getTaskById(taskId) {
        for (const player of GameCore.players) {
            const task = player.pendingTasks.find(t => t.id === taskId);
            if (task) return task;
        }
        return null;
    },

    /**
     * Get all tasks with a specific tag
     */
    getTasksByTag(tag) {
        const tasks = [];
        for (const player of GameCore.players) {
            tasks.push(...player.pendingTasks.filter(t => t.tags.includes(tag)));
        }
        return tasks;
    },

    /**
     * Get tasks by priority level
     */
    getTasksByPriority(priority) {
        const tasks = [];
        for (const player of GameCore.players) {
            tasks.push(...player.pendingTasks.filter(t => t.priority === priority));
        }
        return tasks;
    },

    /**
     * Get overdue tasks
     */
    getOverdueTasks() {
        const now = new Date();
        const tasks = [];
        for (const player of GameCore.players) {
            tasks.push(...player.pendingTasks.filter(t => 
                t.deadline && t.deadline < now && !t.completed
            ));
        }
        return tasks;
    }
};

// Export the TaskManager and constants for use in other modules
window.TaskManager = TaskManager;
window.TaskPriority = TaskPriority;
window.TaskComplexity = TaskComplexity;
