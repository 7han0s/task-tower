class PlayerList {
    constructor(container) {
        this.container = container;
        this.players = new Map();
        this.initialize();
    }

    initialize() {
        this.container.innerHTML = '';
        this.container.classList.add('player-list');
    }

    addPlayer(player) {
        const playerElement = this.createPlayerElement(player);
        this.container.appendChild(playerElement);
        this.players.set(player.id, playerElement);
    }

    updatePlayer(player) {
        const playerElement = this.players.get(player.id);
        if (playerElement) {
            this.updatePlayerElement(playerElement, player);
        }
    }

    removePlayer(playerId) {
        const playerElement = this.players.get(playerId);
        if (playerElement) {
            this.container.removeChild(playerElement);
            this.players.delete(playerId);
        }
    }

    clear() {
        this.container.innerHTML = '';
        this.players.clear();
    }

    createPlayerElement(player) {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'player-name';
        nameSpan.textContent = player.name;
        
        const scoreSpan = document.createElement('span');
        scoreSpan.className = 'player-score';
        scoreSpan.textContent = `Score: ${player.score}`;
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'player-status';
        statusSpan.textContent = player.status || 'Active';
        
        playerDiv.appendChild(nameSpan);
        playerDiv.appendChild(scoreSpan);
        playerDiv.appendChild(statusSpan);
        
        return playerDiv;
    }

    updatePlayerElement(element, player) {
        const scoreSpan = element.querySelector('.player-score');
        const statusSpan = element.querySelector('.player-status');
        
        if (scoreSpan) {
            scoreSpan.textContent = `Score: ${player.score}`;
        }
        if (statusSpan) {
            statusSpan.textContent = player.status || 'Active';
        }
    }
}

module.exports = PlayerList;
