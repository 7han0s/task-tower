class PlayerCount {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'player-count-container';
        
        this.count = document.createElement('div');
        this.count.className = 'player-count';
        this.container.appendChild(this.count);
        
        this.update(0);
    }

    update(count) {
        this.count.textContent = `Players: ${count}`;
    }

    getHTMLElement() {
        return this.container;
    }
}

export default PlayerCount;
