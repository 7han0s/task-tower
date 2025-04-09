/**
 * scoring-manager.js
 * Handles all scoring calculations and bonuses
 */

// Scoring constants
const ScoringConstants = {
    // Base point multipliers
    CATEGORY_MULTIPLIERS: {
        personal: 1.0,
        chores: 1.5,
        work: 2.0
    },

    // Complexity bonuses
    COMPLEXITY_BONUSES: {
        [TaskComplexity.SIMPLE]: 0,
        [TaskComplexity.MODERATE]: 0.2,
        [TaskComplexity.COMPLEX]: 0.5,
        [TaskComplexity.VERY_COMPLEX]: 1.0
    },

    // Priority bonuses
    PRIORITY_BONUSES: {
        [TaskPriority.LOW]: 0,
        [TaskPriority.MEDIUM]: 0.1,
        [TaskPriority.HIGH]: 0.2,
        [TaskPriority.CRITICAL]: 0.3
    },

    // Efficiency bonus (up to 50%)
    EFFICIENCY_MULTIPLIER: 0.5,

    // Deadline bonus (up to 30%)
    DEADLINE_MULTIPLIER: 0.3,

    // Subtask completion bonus (up to 20%)
    SUBTASK_MULTIPLIER: 0.2,

    // Big task bonus
    BIG_TASK_BONUS: 0.5,

    // Teamwork bonus (for multiplayer)
    TEAMWORK_BONUS: 0.2,

    // Streak bonus (for consecutive tasks)
    STREAK_BONUS: 0.1,

    // Maximum bonus limits
    MAX_BONUS: 2.0 // No more than 200% bonus
};

// Scoring Manager class
class ScoringManager {
    constructor() {
        this.streaks = new Map(); // Track player streaks
        this.teamworkBonus = new Map(); // Track teamwork bonuses
    }

    /**
     * Calculate base points for a task
     * @param {Task} task - The task to calculate points for
     * @returns {number} - The base points for the task
     */
    calculateBasePoints(task) {
        const categoryMultiplier = ScoringConstants.CATEGORY_MULTIPLIERS[task.category] || 1;
        return Math.ceil(10 * categoryMultiplier); // Base points start at 10
    }

    /**
     * Calculate complexity bonus
     * @param {Task} task - The task to calculate bonus for
     * @returns {number} - The complexity bonus multiplier
     */
    calculateComplexityBonus(task) {
        return ScoringConstants.COMPLEXITY_BONUSES[task.complexity] || 0;
    }

    /**
     * Calculate priority bonus
     * @param {Task} task - The task to calculate bonus for
     * @returns {number} - The priority bonus multiplier
     */
    calculatePriorityBonus(task) {
        return ScoringConstants.PRIORITY_BONUSES[task.priority] || 0;
    }

    /**
     * Calculate efficiency bonus
     * @param {Task} task - The task to calculate bonus for
     * @returns {number} - The efficiency bonus multiplier
     */
    calculateEfficiencyBonus(task) {
        if (!task.estimatedDuration || !task.actualDuration) return 0;
        
        const timeSaved = task.estimatedDuration - task.actualDuration;
        if (timeSaved <= 0) return 0;
        
        // Calculate bonus based on time saved
        const efficiencyBonus = Math.min(
            ScoringConstants.EFFICIENCY_MULTIPLIER,
            (timeSaved / task.estimatedDuration) * ScoringConstants.EFFICIENCY_MULTIPLIER
        );
        
        return efficiencyBonus;
    }

    /**
     * Calculate deadline bonus
     * @param {Task} task - The task to calculate bonus for
     * @returns {number} - The deadline bonus multiplier
     */
    calculateDeadlineBonus(task) {
        if (!task.deadline || !task.completed) return 0;
        
        const completionTime = task.completed;
        const deadlineTime = task.deadline;
        
        if (completionTime >= deadlineTime) return 0;
        
        // Calculate bonus based on time before deadline
        const timeBeforeDeadline = Math.ceil((deadlineTime - completionTime) / (1000 * 60));
        const totalAvailableTime = Math.ceil((deadlineTime - task.created) / (1000 * 60));
        
        const deadlineBonus = Math.min(
            ScoringConstants.DEADLINE_MULTIPLIER,
            (timeBeforeDeadline / totalAvailableTime) * ScoringConstants.DEADLINE_MULTIPLIER
        );
        
        return deadlineBonus;
    }

    /**
     * Calculate subtask completion bonus
     * @param {Task} task - The task to calculate bonus for
     * @returns {number} - The subtask bonus multiplier
     */
    calculateSubtaskBonus(task) {
        if (!task.subtasks || task.subtasks.length === 0) return 0;
        
        const completedSubtasks = task.subtasks.filter(st => st.completed).length;
        const totalSubtasks = task.subtasks.length;
        
        const subtaskBonus = (completedSubtasks / totalSubtasks) * ScoringConstants.SUBTASK_MULTIPLIER;
        return subtaskBonus;
    }

    /**
     * Calculate big task bonus
     * @param {Task} task - The task to calculate bonus for
     * @returns {number} - The big task bonus multiplier
     */
    calculateBigTaskBonus(task) {
        return task.isBigTask ? ScoringConstants.BIG_TASK_BONUS : 0;
    }

    /**
     * Calculate teamwork bonus
     * @param {number} playerId - The player's ID
     * @returns {number} - The teamwork bonus multiplier
     */
    calculateTeamworkBonus(playerId) {
        const currentBonus = this.teamworkBonus.get(playerId) || 0;
        return currentBonus;
    }

    /**
     * Calculate streak bonus
     * @param {number} playerId - The player's ID
     * @returns {number} - The streak bonus multiplier
     */
    calculateStreakBonus(playerId) {
        const currentStreak = this.streaks.get(playerId) || 0;
        return currentStreak * ScoringConstants.STREAK_BONUS;
    }

    /**
     * Update streak for a player
     * @param {number} playerId - The player's ID
     * @param {boolean} success - Whether the task was completed successfully
     */
    updateStreak(playerId, success) {
        const currentStreak = this.streaks.get(playerId) || 0;
        
        if (success) {
            this.streaks.set(playerId, currentStreak + 1);
        } else {
            this.streaks.set(playerId, 0);
        }
    }

    /**
     * Update teamwork bonus for a player
     * @param {number} playerId - The player's ID
     * @param {number} bonus - The bonus amount to add
     */
    updateTeamworkBonus(playerId, bonus) {
        const currentBonus = this.teamworkBonus.get(playerId) || 0;
        this.teamworkBonus.set(playerId, Math.min(
            ScoringConstants.MAX_BONUS,
            currentBonus + bonus
        ));
    }

    /**
     * Calculate final score for a task
     * @param {Task} task - The task to calculate score for
     * @param {number} playerId - The player's ID
     * @returns {object} - Object containing final score and breakdown
     */
    calculateFinalScore(task, playerId) {
        // Calculate base points
        let finalScore = this.calculateBasePoints(task);
        
        // Calculate all bonuses
        const complexityBonus = this.calculateComplexityBonus(task);
        const priorityBonus = this.calculatePriorityBonus(task);
        const efficiencyBonus = this.calculateEfficiencyBonus(task);
        const deadlineBonus = this.calculateDeadlineBonus(task);
        const subtaskBonus = this.calculateSubtaskBonus(task);
        const bigTaskBonus = this.calculateBigTaskBonus(task);
        const teamworkBonus = this.calculateTeamworkBonus(playerId);
        const streakBonus = this.calculateStreakBonus(playerId);
        
        // Apply bonuses while respecting max bonus limit
        const totalBonus = Math.min(
            ScoringConstants.MAX_BONUS,
            complexityBonus + priorityBonus + efficiencyBonus + 
            deadlineBonus + subtaskBonus + bigTaskBonus + 
            teamworkBonus + streakBonus
        );
        
        finalScore = Math.ceil(finalScore * (1 + totalBonus));
        
        return {
            finalScore,
            breakdown: {
                basePoints: this.calculateBasePoints(task),
                complexity: complexityBonus,
                priority: priorityBonus,
                efficiency: efficiencyBonus,
                deadline: deadlineBonus,
                subtasks: subtaskBonus,
                bigTask: bigTaskBonus,
                teamwork: teamworkBonus,
                streak: streakBonus,
                totalBonus
            }
        };
    }

    /**
     * Reset all scoring data
     */
    reset() {
        this.streaks.clear();
        this.teamworkBonus.clear();
    }
}

// Export the ScoringManager and constants
window.ScoringManager = ScoringManager;
window.ScoringConstants = ScoringConstants;
