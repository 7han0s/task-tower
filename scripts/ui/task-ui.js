/**
 * task-ui.js
 * Handles UI rendering and interactions for tasks
 */

import { TaskManager } from '../core/task-manager.js';
import { ScoringManager } from '../core/scoring-manager.js';

const TaskUI = {
    /**
     * Initialize task UI
     */
    init() {
        this.setupEventListeners();
        this.renderTaskFilters();
        this.renderTasks();
    },

    /**
     * Set up event listeners for task interactions
     */
    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => this.handleFilterClick(button));
        });

        // Complete task buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('complete-btn')) {
                this.handleCompleteTask(e.target.closest('.task-item'));
            }
        });

        // Subtask buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('subtask-btn')) {
                this.toggleSubtasks(e.target.closest('.task-item'));
            }
        });

        // Add subtask buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-subtask-btn')) {
                this.showAddSubtaskModal(e.target.closest('.task-item'));
            }
        });
    },

    /**
     * Handle filter button click
     * @param {HTMLElement} button - The clicked filter button
     */
    handleFilterClick(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');

        // Get filter type from button ID
        const filterType = button.id.replace('filter-', '');

        // Filter and render tasks
        this.renderTasks(filterType);
    },

    /**
     * Handle task completion
     * @param {HTMLElement} taskElement - The task element being completed
     */
    handleCompleteTask(taskElement) {
        const taskId = taskElement.dataset.taskId;
        const playerId = taskElement.dataset.playerId;

        try {
            // Complete the task
            const result = TaskManager.completeTask(playerId, taskId);
            
            // Update UI with new score
            const pointsElement = taskElement.querySelector('.points-text');
            pointsElement.textContent = `+${result.finalScore} points`;
            
            // Update progress bar
            const progressBar = taskElement.querySelector('.progress-bar');
            progressBar.style.width = '100%';
            
            // Add completion animation
            taskElement.classList.add('completed');
            
            // Update task status
            const statusElement = taskElement.querySelector('.status-text');
            statusElement.textContent = 'Completed';
            
            // Update player's score
            this.updatePlayerScore(playerId, result.finalScore);
        } catch (error) {
            console.error('Error completing task:', error);
            alert('Error completing task: ' + error.message);
        }
    },

    /**
     * Toggle subtasks visibility
     * @param {HTMLElement} taskElement - The task element containing subtasks
     */
    toggleSubtasks(taskElement) {
        const subtasksContainer = taskElement.querySelector('.subtasks-container');
        subtasksContainer.classList.toggle('hidden');
    },

    /**
     * Show add subtask modal
     * @param {HTMLElement} taskElement - The task element to add subtask to
     */
    showAddSubtaskModal(taskElement) {
        const taskId = taskElement.dataset.taskId;
        const playerId = taskElement.dataset.playerId;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';

        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white p-6 rounded-lg shadow-lg';

        const form = document.createElement('form');
        form.innerHTML = `
            <h3 class="text-lg font-semibold mb-4">Add Subtask</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Description</label>
                <input type="text" class="w-full p-2 border rounded" required>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Estimated Duration (minutes)</label>
                <input type="number" class="w-full p-2 border rounded" required>
            </div>
            <div class="flex justify-end space-x-2">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="add-btn">Add</button>
            </div>
        `;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const description = form.querySelector('input[type="text"]').value;
            const duration = parseInt(form.querySelector('input[type="number"]').value);

            try {
                TaskManager.addSubtaskToTask(taskId, description, duration);
                this.renderTasks();
                modal.remove();
            } catch (error) {
                console.error('Error adding subtask:', error);
                alert('Error adding subtask: ' + error.message);
            }
        });

        form.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        modalContent.appendChild(form);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    },

    /**
     * Render task filters
     */
    renderTaskFilters() {
        const filterContainer = document.querySelector('#task-list-container .flex.flex-wrap.gap-2');
        if (!filterContainer) return;

        // Clear existing filters
        filterContainer.innerHTML = '';

        // Add filter buttons
        const filters = ['all', 'personal', 'chores', 'work', 'big', 'overdue'];
        filters.forEach(filter => {
            const button = document.createElement('button');
            button.className = 'filter-btn px-3 py-1 rounded hover:bg-gray-100';
            button.id = `filter-${filter}`;
            button.textContent = filter.charAt(0).toUpperCase() + filter.slice(1);
            filterContainer.appendChild(button);
        });

        // Add active class to 'All' filter
        document.getElementById('filter-all').classList.add('active');
    },

    /**
     * Render tasks with optional filter
     * @param {string} [filterType] - Optional filter type
     */
    renderTasks(filterType = 'all') {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        // Clear existing tasks
        taskList.innerHTML = '';

        // Get tasks based on filter
        let tasks = [];
        for (const player of GameCore.players) {
            tasks = [...tasks, ...player.pendingTasks];
        }

        // Apply filter
        if (filterType !== 'all') {
            tasks = tasks.filter(task => {
                switch (filterType) {
                    case 'personal':
                        return task.category === 'personal';
                    case 'chores':
                        return task.category === 'chores';
                    case 'work':
                        return task.category === 'work';
                    case 'big':
                        return task.isBigTask;
                    case 'overdue':
                        return task.deadline && new Date() > new Date(task.deadline);
                    default:
                        return true;
                }
            });
        }

        // Sort tasks by priority and deadline
        tasks.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            if (a.deadline && b.deadline) {
                return new Date(a.deadline) - new Date(b.deadline);
            }
            return 0;
        });

        // Create task elements
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    },

    /**
     * Create task element
     * @param {Task} task - The task to create UI for
     * @returns {HTMLElement} - The task UI element
     */
    createTaskElement(task) {
        const template = document.getElementById('task-template');
        const clone = template.content.cloneNode(true);

        // Set task data attributes
        const taskElement = clone.querySelector('.task-item');
        taskElement.dataset.taskId = task.id;
        taskElement.dataset.playerId = task.playerId;

        // Set task title
        const titleElement = taskElement.querySelector('.task-title');
        titleElement.textContent = task.description;

        // Set task metadata
        const categoryTag = taskElement.querySelector('.category-tag');
        categoryTag.textContent = task.category;
        categoryTag.className = `category-tag bg-${task.category}-100 text-${task.category}-700 px-2 py-1 rounded`;

        const priorityTag = taskElement.querySelector('.priority-tag');
        priorityTag.textContent = `Priority: ${TaskPriority[task.priority]}`;
        priorityTag.className = `priority-tag bg-${task.priority}-100 text-${task.priority}-700 px-2 py-1 rounded`;

        const complexityTag = taskElement.querySelector('.complexity-tag');
        complexityTag.textContent = `Complexity: ${TaskComplexity[task.complexity]}`;
        complexityTag.className = `complexity-tag bg-${task.complexity}-100 text-${task.complexity}-700 px-2 py-1 rounded`;

        // Set progress bar
        const progressBar = taskElement.querySelector('.progress-bar');
        progressBar.style.width = `${task.progress}%`;

        // Set task status
        const statusElement = taskElement.querySelector('.status-text');
        statusElement.textContent = task.completed ? 'Completed' : 'In Progress';

        // Set points
        const pointsElement = taskElement.querySelector('.points-text');
        pointsElement.textContent = task.completed ? `+${task.points} points` : '';

        // Add subtasks
        const subtasksContainer = taskElement.querySelector('.subtasks-list');
        if (task.subtasks && task.subtasks.length > 0) {
            task.subtasks.forEach(subtask => {
                const subtaskElement = document.createElement('div');
                subtaskElement.className = 'subtask-item flex items-center space-x-2';
                subtaskElement.innerHTML = `
                    <input type="checkbox" ${subtask.completed ? 'checked' : ''}>
                    <span>${subtask.description}</span>
                `;
                subtasksContainer.appendChild(subtaskElement);
            });
        }

        return taskElement;
    },

    /**
     * Update player's score display
     * @param {number} playerId - The player's ID
     * @param {number} points - Points to add
     */
    updatePlayerScore(playerId, points) {
        const player = GameCore.players.find(p => p.id === playerId);
        if (!player) return;

        // Update player's score
        player.score += points;

        // Update score display
        const scoreElement = document.querySelector(`#player-${playerId} .score`);
        if (scoreElement) {
            scoreElement.textContent = player.score;
        }
    }
};

// Export the TaskUI module
export default TaskUI;
