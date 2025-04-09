class StorageManager {
    constructor() {
        this.isAvailable = this.checkStorageAvailability();
    }

    checkStorageAvailability() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    async saveGame(state) {
        if (!this.isAvailable) {
            throw new Error('Storage is not available');
        }

        try {
            localStorage.setItem('gameState', JSON.stringify(state));
            return true;
        } catch (error) {
            console.error('Error saving game state:', error);
            throw error;
        }
    }

    async loadGame() {
        if (!this.isAvailable) {
            throw new Error('Storage is not available');
        }

        try {
            const state = localStorage.getItem('gameState');
            return state ? JSON.parse(state) : null;
        } catch (error) {
            console.error('Error loading game state:', error);
            throw error;
        }
    }

    async clearGame() {
        if (!this.isAvailable) {
            throw new Error('Storage is not available');
        }

        try {
            localStorage.removeItem('gameState');
            return true;
        } catch (error) {
            console.error('Error clearing game state:', error);
            throw error;
        }
    }

    async backupGame(state) {
        if (!this.isAvailable) {
            throw new Error('Storage is not available');
        }

        try {
            const backupKey = `gameState_backup_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(state));
            return backupKey;
        } catch (error) {
            console.error('Error creating game backup:', error);
            throw error;
        }
    }

    async restoreBackup(backupKey) {
        if (!this.isAvailable) {
            throw new Error('Storage is not available');
        }

        try {
            const backup = localStorage.getItem(backupKey);
            if (!backup) {
                throw new Error('Backup not found');
            }
            return JSON.parse(backup);
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw error;
        }
    }

    async getBackups() {
        if (!this.isAvailable) {
            throw new Error('Storage is not available');
        }

        try {
            const backups = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('gameState_backup_')) {
                    const timestamp = key.replace('gameState_backup_', '');
                    backups.push({
                        key,
                        timestamp,
                        size: localStorage.getItem(key).length
                    });
                }
            }
            return backups;
        } catch (error) {
            console.error('Error getting backups:', error);
            throw error;
        }
    }

    async deleteBackup(backupKey) {
        if (!this.isAvailable) {
            throw new Error('Storage is not available');
        }

        try {
            if (localStorage.getItem(backupKey)) {
                localStorage.removeItem(backupKey);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting backup:', error);
            throw error;
        }
    }
}

module.exports = StorageManager;
