const { TaskManager } = require('../../scripts/core/task-manager.js');
const { TaskComplexity } = require('../../scripts/core/task-complexity.js');

describe('Task Manager', () => {
    let taskManager;

    beforeEach(() => {
        taskManager = new TaskManager();
    });

    test('should add task correctly', () => {
        const task = {
            title: 'Test Task',
            description: 'This is a test task',
            category: 'work',
            complexity: TaskComplexity.MODERATE,
            points: 3
        };

        const addedTask = taskManager.addTask(task);
        expect(addedTask.id).toBeDefined();
        expect(addedTask.title).toBe(task.title);
        expect(addedTask.category).toBe(task.category);
        expect(addedTask.complexity).toBe(task.complexity);
        expect(addedTask.points).toBe(task.points);
    });

    test('should update task correctly', () => {
        const task = {
            title: 'Test Task',
            description: 'This is a test task',
            category: 'work',
            complexity: TaskComplexity.MODERATE,
            points: 3
        };

        const addedTask = taskManager.addTask(task);
        const updates = {
            status: 'completed',
            progress: 100
        };

        const updatedTask = taskManager.updateTask(addedTask.id, updates);
        expect(updatedTask.status).toBe(updates.status);
        expect(updatedTask.progress).toBe(updates.progress);
    });

    test('should remove task correctly', () => {
        const task = {
            title: 'Test Task',
            description: 'This is a test task',
            category: 'work',
            complexity: TaskComplexity.MODERATE,
            points: 3
        };

        const addedTask = taskManager.addTask(task);
        const removed = taskManager.removeTask(addedTask.id);
        expect(removed).toBe(true);

        const taskExists = taskManager.getTasks().some(t => t.id === addedTask.id);
        expect(taskExists).toBe(false);
    });

    test('should handle task dependencies', () => {
        const parentTask = {
            title: 'Parent Task',
            description: 'This is the parent task',
            category: 'work',
            complexity: TaskComplexity.COMPLEX,
            points: 5
        };

        const childTask = {
            title: 'Child Task',
            description: 'This is the child task',
            category: 'work',
            complexity: TaskComplexity.MODERATE,
            points: 3,
            dependsOn: []
        };

        const parent = taskManager.addTask(parentTask);
        childTask.dependsOn = [parent.id];
        const child = taskManager.addTask(childTask);

        expect(child.dependsOn).toContain(parent.id);
    });

    test('should validate task data', () => {
        const invalidTask = {
            title: '', // Invalid - empty title
            category: 'invalid', // Invalid - not in allowed categories
            complexity: 'invalid', // Invalid - not a valid complexity level
            points: -1 // Invalid - negative points
        };

        expect(() => taskManager.addTask(invalidTask)).toThrow();
    });

    test('should calculate task progress', () => {
        const task = {
            title: 'Test Task',
            description: 'This is a test task',
            category: 'work',
            complexity: TaskComplexity.MODERATE,
            points: 3,
            subtasks: [
                { title: 'Subtask 1', completed: true },
                { title: 'Subtask 2', completed: false },
                { title: 'Subtask 3', completed: true }
            ]
        };

        const addedTask = taskManager.addTask(task);
        const progress = taskManager.calculateProgress(addedTask);
        expect(progress).toBe(66.66666666666666); // 2 out of 3 subtasks completed
    });

    test('should handle task completion', () => {
        const task = {
            title: 'Test Task',
            description: 'This is a test task',
            category: 'work',
            complexity: TaskComplexity.MODERATE,
            points: 3
        };

        const addedTask = taskManager.addTask(task);
        taskManager.updateTask(addedTask.id, { status: 'completed' });

        const completedTask = taskManager.getTaskById(addedTask.id);
        expect(completedTask.status).toBe('completed');
    });
});
