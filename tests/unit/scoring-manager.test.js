const { ScoringManager } = require('../../scripts/core/scoring-manager');

describe('Scoring Manager', () => {
    let scoringManager;

    beforeEach(() => {
        scoringManager = new ScoringManager();
    });

    test('should calculate base points correctly', () => {
        const task = {
            category: 'personal',
            isBigTask: false
        };

        const points = scoringManager.calculateBasePoints(task);
        expect(points).toBe(1);

        task.category = 'chores';
        expect(scoringManager.calculateBasePoints(task)).toBe(2);

        task.category = 'work';
        expect(scoringManager.calculateBasePoints(task)).toBe(3);

        task.isBigTask = true;
        expect(scoringManager.calculateBasePoints(task)).toBe(4.5);
    });

    test('should calculate complexity bonus correctly', () => {
        const task = {
            complexity: 'SIMPLE'
        };

        const bonus = scoringManager.calculateComplexityBonus(task);
        expect(bonus).toBe(1.1);

        task.complexity = 'MEDIUM';
        expect(scoringManager.calculateComplexityBonus(task)).toBe(1.25);

        task.complexity = 'COMPLEX';
        expect(scoringManager.calculateComplexityBonus(task)).toBe(1.5);

        task.complexity = 'VERY_COMPLEX';
        expect(scoringManager.calculateComplexityBonus(task)).toBe(2.0);
    });

    test('should calculate priority bonus correctly', () => {
        const task = {
            priority: 'LOW'
        };

        const bonus = scoringManager.calculatePriorityBonus(task);
        expect(bonus).toBe(1.0);

        task.priority = 'MEDIUM';
        expect(scoringManager.calculatePriorityBonus(task)).toBe(1.2);

        task.priority = 'HIGH';
        expect(scoringManager.calculatePriorityBonus(task)).toBe(1.5);

        task.priority = 'CRITICAL';
        expect(scoringManager.calculatePriorityBonus(task)).toBe(2.0);
    });

    test('should calculate efficiency bonus correctly', () => {
        const task = {
            timeTaken: 600, // 10 minutes
            timeLimit: 1200 // 20 minutes
        };

        const bonus = scoringManager.calculateEfficiencyBonus(task);
        expect(bonus).toBe(1.5);

        task.timeTaken = 300; // 5 minutes
        expect(scoringManager.calculateEfficiencyBonus(task)).toBe(2.0);

        task.timeTaken = 900; // 15 minutes
        expect(scoringManager.calculateEfficiencyBonus(task)).toBe(1.25);

        task.timeTaken = 1200; // 20 minutes
        expect(scoringManager.calculateEfficiencyBonus(task)).toBe(1.0);
    });

    test('should calculate total score correctly', () => {
        const task = {
            category: 'work',
            isBigTask: true,
            complexity: 'VERY_COMPLEX',
            priority: 'CRITICAL',
            timeTaken: 300, // 5 minutes
            timeLimit: 1200 // 20 minutes
        };

        const score = scoringManager.calculateTotalScore(task);
        expect(score).toBeGreaterThan(10);
        expect(score).toBeLessThan(20);
    });

    test('should handle invalid task data', () => {
        const invalidTask = {};
        expect(() => scoringManager.calculateTotalScore(invalidTask)).toThrow();

        const taskWithInvalidData = {
            category: 'invalid',
            complexity: 'invalid',
            priority: 'invalid'
        };
        expect(() => scoringManager.calculateTotalScore(taskWithInvalidData)).toThrow();
    });
});
