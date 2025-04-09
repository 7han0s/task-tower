export const GameSettings = {
    DEFAULTS: {
        maxPlayers: 8,
        maxRounds: 20,
        roundTime: 25,
        breakTime: 5,
        pointSystem: {
            work: 3,
            personal: 2,
            chores: 1,
            bigTaskMultiplier: 1.5
        }
    },

    validateSettings(settings) {
        if (!settings) return false;

        const requiredFields = ['maxPlayers', 'maxRounds', 'roundTime', 'breakTime'];
        return requiredFields.every(field => field in settings);
    },

    applySettings(settings) {
        if (!this.validateSettings(settings)) {
            throw new Error('Invalid game settings');
        }
        return settings;
    }
};
