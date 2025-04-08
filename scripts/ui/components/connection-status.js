class ConnectionStatus {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'connection-status-container';
        
        this.status = document.createElement('div');
        this.status.className = 'connection-status';
        this.container.appendChild(this.status);
        
        this.update(false);
    }

    update(connected) {
        this.status.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        this.status.textContent = connected ? 'Connected' : 'Disconnected';
    }

    getHTMLElement() {
        return this.container;
    }
}

export default ConnectionStatus;
