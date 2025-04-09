const { TaskManager } = require('../../scripts/core/task-manager');

describe('Task Manager', () => {
    let taskManager;

    beforeEach(() => {
        taskManager = new TaskManager();
    });

    test('should add task correctly', () => {
        const task = {
            description: 'Test task',
            category: 'work',
            complexity: 'MEDIUM',
            priority: 'HIGH'
        };

        const taskId = taskManager.addTask(task);
        expect(taskId).toBeDefined();
        expect(taskManager.getTask(taskId)).toEqual(expect.objectContaining(task));
    });

    test('should update task correctly', () => {
        const task = {
            description: 'Test task',
            category: 'work',
            complexity: 'MEDIUM',
            priority: 'HIGH'
        };

        const taskId = taskManager.addTask(task);
        const updatedTask = {
            description: 'Updated task',
            status: 'completed',
            progress: 100
        };

        taskManager.updateTask(taskId, updatedTask);
        const updated = taskManager.getTask(taskId);
        expect(updated).toEqual(expect.objectContaining(updatedTask));
    });

    test('should remove task correctly', () => {
        const task = {
            description: 'Test task',
            category: 'work',
            complexity: 'MEDIUM',
            priority: 'HIGH'
        };

        const taskId = taskManager.addTask(task);
        taskManager.removeTask(taskId);
        expect(taskManager.getTask(taskId)).toBeNull();
    });

    test('should handle task dependencies', () => {
        const parentTask = {
            description: 'Parent task',
            category: 'work'
        };

        const childTask = {
            description: 'Child task',
            category: 'work'
        };

        const parentId = taskManager.addTask(parentTask);
        const childId = taskManager.addTask(childTask);

        taskManager.addDependency(parentId, childId);
        expect(taskManager.getDependencies(parentId)).toContain(childId);
        expect(taskManager.getDependents(childId)).toContain(parentId);

        taskManager.removeDependency(parentId, childId);
        expect(taskManager.getDependencies(parentId)).not.toContain(childId);
        expect(taskManager.getDependents(childId)).not.toContain(parentId);
    });

    test('should validate task data', () => {
        const invalidTask = {};
        expect(() => taskManager.addTask(invalidTask)).toThrow();

        const taskWithInvalidCategory = {
            description: 'Test task',
            category: 'invalid'
        };
        expect(() => taskManager.addTask(taskWithInvalidCategory)).toThrow();

        const taskWithInvalidComplexity = {
            description: 'Test task',
            category: 'work',
            complexity: 'invalid'
        };
        expect(() => taskManager.addTask(taskWithInvalidComplexity)).toThrow();

        const taskWithInvalidPriority = {
            description: 'Test task',
            category: 'work',
            priority: 'invalid'
        };
        expect(() => taskManager.addTask(taskWithInvalidPriority)).toThrow();
    });

    test('should calculate task progress', () => {
        const task = {
            description: 'Test task',
            category: 'work',
            subtasks: [
                { description: 'Subtask 1', progress: 50 },
                { description: 'Subtask 2', progress: 75 }
            ]
        };

        const taskId = taskManager.addTask(task);
        const progress = taskManager.calculateProgress(taskId);
        expect(progress).toBe(62.5);

        taskManager.updateTask(taskId, { progress: 100 });
        expect(taskManager.calculateProgress(taskId)).toBe(100);
    });

    test('should handle task completion', () => {
        const task = {
            description: 'Test task',
            category: 'work',
            subtasks: [
                { description: 'Subtask 1' },
                { description: 'Subtask 2' }
            ]
        };

        const taskId = taskManager.addTask(task);
        taskManager.completeTask(taskId);
        expect(taskManager.getTask(taskId).status).toBe('completed');

        // Complete subtasks
        const subtasks = taskManager.getSubtasks(taskId);
        subtasks.forEach(subtaskId => {
            taskManager.completeTask(subtaskId);
            expect(taskManager.getTask(subtaskId).status).toBe('completed');
        });
    });
});
