class PlayerList {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'player-list-container';
        
        this.header = document.createElement('h2');
        this.header.textContent = 'Players';
        this.container.appendChild(this.header);
        
        this.list = document.createElement('div');
        this.list.className = 'player-list';
        this.container.appendChild(this.list);
    }

    update(players) {
        this.list.innerHTML = '';
        players.forEach(player => {
            const playerCard = this.createPlayerCard(player);
            this.list.appendChild(playerCard);
        });
    }

    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';
        
        const name = document.createElement('div');
        name.className = 'player-name';
        name.textContent = player.name;
        
        const score = document.createElement('div');
        score.className = 'player-score';
        score.textContent = `Score: ${player.score}`;
        
        const status = document.createElement('div');
        status.className = `player-status ${player.isConnected ? 'connected' : 'disconnected'}`;
        status.textContent = player.isConnected ? 'Connected' : 'Disconnected';
        
        card.appendChild(name);
        card.appendChild(score);
        card.appendChild(status);
        
        return card;
    }

    getHTMLElement() {
        return this.container;
    }
}

export default PlayerList;
