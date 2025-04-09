class GameSettings {
    constructor() {
        this.config = {
            // Game settings
            maxPlayers: 8,
            maxRounds: 20,
            roundTime: 25, // in minutes
            breakTime: 5, // in minutes
            
            // Task settings
            maxTasksPerPlayer: 5,
            taskCategories: ['personal', 'chores', 'work'],
            
            // Scoring settings
            basePoints: 1,
            categoryBonuses: {
                personal: 0.5,
                chores: 1.0,
                work: 1.5
            },
            
            // UI settings
            theme: 'light',
            fontSize: 'medium',
            animationSpeed: 'normal'
        };
    }

    getSetting(key) {
        return this.config[key];
    }

    setSetting(key, value) {
        if (key in this.config) {
            this.config[key] = value;
            return true;
        }
        return false;
    }

    validateSettings() {
        const errors = [];

        // Validate numeric settings
        const numericSettings = ['maxPlayers', 'maxRounds', 'roundTime', 'breakTime', 'maxTasksPerPlayer'];
        numericSettings.forEach(setting => {
            if (typeof this.config[setting] !== 'number' || this.config[setting] <= 0) {
                errors.push(`Invalid value for ${setting}`);
            }
        });

        // Validate time settings
        if (this.config.roundTime < 1 || this.config.roundTime > 60) {
            errors.push('Round time must be between 1 and 60 minutes');
        }
        if (this.config.breakTime < 1 || this.config.breakTime > 15) {
            errors.push('Break time must be between 1 and 15 minutes');
        }

        return errors.length === 0 ? true : errors;
    }

    resetToDefaults() {
        this.config = {
            maxPlayers: 8,
            maxRounds: 20,
            roundTime: 25,
            breakTime: 5,
            maxTasksPerPlayer: 5,
            taskCategories: ['personal', 'chores', 'work'],
            basePoints: 1,
            categoryBonuses: {
                personal: 0.5,
                chores: 1.0,
                work: 1.5
            },
            theme: 'light',
            fontSize: 'medium',
            animationSpeed: 'normal'
        };
    }
}

module.exports = GameSettings;
