class TaskList {
    constructor(container) {
        this.container = container;
        this.tasks = new Map();
        this.initialize();
    }

    initialize() {
        this.container.innerHTML = '';
        this.container.classList.add('task-list');
    }

    addTask(task) {
        const taskElement = this.createTaskElement(task);
        this.container.appendChild(taskElement);
        this.tasks.set(task.id, taskElement);
    }

    updateTask(task) {
        const taskElement = this.tasks.get(task.id);
        if (taskElement) {
            this.updateTaskElement(taskElement, task);
        }
    }

    removeTask(taskId) {
        const taskElement = this.tasks.get(taskId);
        if (taskElement) {
            this.container.removeChild(taskElement);
            this.tasks.delete(taskId);
        }
    }

    clear() {
        this.container.innerHTML = '';
        this.tasks.clear();
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'task-title';
        titleSpan.textContent = task.title;
        
        const categorySpan = document.createElement('span');
        categorySpan.className = 'task-category';
        categorySpan.textContent = task.category;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'task-status';
        statusSpan.textContent = task.status || 'Pending';
        
        const progressSpan = document.createElement('span');
        progressSpan.className = 'task-progress';
        progressSpan.textContent = `Progress: ${task.progress || 0}%`;
        
        taskDiv.appendChild(titleSpan);
        taskDiv.appendChild(categorySpan);
        taskDiv.appendChild(statusSpan);
        taskDiv.appendChild(progressSpan);
        
        return taskDiv;
    }

    updateTaskElement(element, task) {
        const statusSpan = element.querySelector('.task-status');
        const progressSpan = element.querySelector('.task-progress');
        
        if (statusSpan) {
            statusSpan.textContent = task.status || 'Pending';
        }
        if (progressSpan) {
            progressSpan.textContent = `Progress: ${task.progress || 0}%`;
        }
    }
}

module.exports = TaskList;
