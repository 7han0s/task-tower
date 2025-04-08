class TaskList {
    constructor(playerId) {
        this.playerId = playerId;
        this.container = document.createElement('div');
        this.container.className = 'task-list-container';
        
        this.header = document.createElement('h3');
        this.header.textContent = 'Tasks';
        this.container.appendChild(this.header);
        
        this.list = document.createElement('div');
        this.list.className = 'task-list';
        this.container.appendChild(this.list);
    }

    update(tasks) {
        this.list.innerHTML = '';
        tasks.forEach(task => {
            const taskItem = this.createTaskItem(task);
            this.list.appendChild(taskItem);
        });
    }

    createTaskItem(task) {
        const item = document.createElement('div');
        item.className = 'task-item';
        
        const description = document.createElement('div');
        description.className = 'task-description';
        description.textContent = task.description;
        
        const status = document.createElement('div');
        status.className = `task-status ${task.status}`;
        status.textContent = task.status;
        
        const progress = document.createElement('div');
        progress.className = 'task-progress';
        progress.style.width = `${task.progress}%`;
        
        item.appendChild(description);
        item.appendChild(status);
        item.appendChild(progress);
        
        return item;
    }

    getHTMLElement() {
        return this.container;
    }
}

export default TaskList;
