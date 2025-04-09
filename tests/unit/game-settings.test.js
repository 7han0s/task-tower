const { GameSettings } = require('../../scripts/core/game-settings');

describe('Game Settings', () => {
    let settings;

    beforeEach(() => {
        settings = new GameSettings();
    });

    test('should initialize with default settings', () => {
        expect(settings.maxPlayers).toBe(8);
        expect(settings.maxRounds).toBe(20);
        expect(settings.roundTime).toBe(25);
        expect(settings.breakTime).toBe(5);
        expect(settings.difficulty).toBe('NORMAL');
        expect(settings.allowCustomTasks).toBe(true);
        expect(settings.enableAnimations).toBe(true);
    });

    test('should validate settings correctly', () => {
        // Test invalid max players
        expect(() => settings.set('maxPlayers', 0)).toThrow();
        expect(() => settings.set('maxPlayers', 100)).toThrow();

        // Test invalid max rounds
        expect(() => settings.set('maxRounds', 0)).toThrow();
        expect(() => settings.set('maxRounds', 100)).toThrow();

        // Test invalid round time
        expect(() => settings.set('roundTime', 0)).toThrow();
        expect(() => settings.set('roundTime', 120)).toThrow();

        // Test invalid break time
        expect(() => settings.set('breakTime', 0)).toThrow();
        expect(() => settings.set('breakTime', 30)).toThrow();

        // Test invalid difficulty
        expect(() => settings.set('difficulty', 'INVALID')).toThrow();

        // Test invalid boolean settings
        expect(() => settings.set('allowCustomTasks', 'invalid')).toThrow();
        expect(() => settings.set('enableAnimations', 'invalid')).toThrow();
    });

    test('should persist settings correctly', () => {
        const testSettings = {
            maxPlayers: 6,
            maxRounds: 15,
            roundTime: 30,
            breakTime: 10,
            difficulty: 'HARD',
            allowCustomTasks: false,
            enableAnimations: false
        };

        // Set all settings
        Object.entries(testSettings).forEach(([key, value]) => {
            settings.set(key, value);
        });

        // Verify settings persisted
        Object.entries(testSettings).forEach(([key, value]) => {
            expect(settings.get(key)).toBe(value);
        });

        // Reset settings
        settings.reset();

        // Verify default settings restored
        expect(settings.maxPlayers).toBe(8);
        expect(settings.maxRounds).toBe(20);
        expect(settings.roundTime).toBe(25);
        expect(settings.breakTime).toBe(5);
        expect(settings.difficulty).toBe('NORMAL');
        expect(settings.allowCustomTasks).toBe(true);
        expect(settings.enableAnimations).toBe(true);
    });

    test('should handle custom settings', () => {
        // Add custom setting
        settings.addCustomSetting('customSetting', {
            type: 'number',
            defaultValue: 10,
            min: 0,
            max: 100
        });

        // Verify custom setting exists
        expect(settings.get('customSetting')).toBe(10);

        // Update custom setting
        settings.set('customSetting', 50);
        expect(settings.get('customSetting')).toBe(50);

        // Verify custom setting validation
        expect(() => settings.set('customSetting', -1)).toThrow();
        expect(() => settings.set('customSetting', 101)).toThrow();

        // Remove custom setting
        settings.removeCustomSetting('customSetting');
        expect(() => settings.get('customSetting')).toThrow();
    });

    test('should handle setting changes', () => {
        let changeCount = 0;
        const onChange = () => {
            changeCount++;
        };

        // Subscribe to changes
        settings.onChange(onChange);

        // Update settings
        settings.set('maxPlayers', 6);
        expect(changeCount).toBe(1);

        settings.set('maxRounds', 15);
        expect(changeCount).toBe(2);

        // Unsubscribe
        settings.offChange(onChange);

        // Update setting again
        settings.set('maxPlayers', 8);
        expect(changeCount).toBe(2); // Should not increment since we unsubscribed

        // Subscribe again
        settings.onChange(onChange);
        settings.set('maxPlayers', 6);
        expect(changeCount).toBe(3);
    });

    test('should handle setting categories', () => {
        // Add settings to categories
        settings.addSettingToCategory('Game', 'maxPlayers');
        settings.addSettingToCategory('Game', 'maxRounds');
        settings.addSettingToCategory('Time', 'roundTime');
        settings.addSettingToCategory('Time', 'breakTime');

        // Get settings by category
        const gameSettings = settings.getSettingsByCategory('Game');
        expect(gameSettings).toContain('maxPlayers');
        expect(gameSettings).toContain('maxRounds');
        expect(gameSettings).not.toContain('roundTime');

        const timeSettings = settings.getSettingsByCategory('Time');
        expect(timeSettings).toContain('roundTime');
        expect(timeSettings).toContain('breakTime');
        expect(timeSettings).not.toContain('maxPlayers');

        // Remove category
        settings.removeCategory('Game');
        const emptyGameSettings = settings.getSettingsByCategory('Game');
        expect(emptyGameSettings).toEqual([]);
    });

    test('should handle setting dependencies', () => {
        // Add dependency
        settings.addDependency('roundTime', 'breakTime');
        settings.addDependency('maxRounds', 'roundTime');

        // Update dependent setting
        settings.set('roundTime', 30);
        expect(settings.get('breakTime')).toBe(10); // Should update breakTime based on roundTime

        settings.set('maxRounds', 15);
        expect(settings.get('roundTime')).toBe(30); // Should update roundTime based on maxRounds

        // Remove dependency
        settings.removeDependency('roundTime', 'breakTime');
        settings.set('roundTime', 25);
        expect(settings.get('breakTime')).toBe(10); // Should not change since dependency removed
    });

    test('should handle setting validation rules', () => {
        // Add validation rule
        settings.addValidationRule('roundTime', (value) => {
            if (value < settings.get('breakTime')) {
                throw new Error('Round time must be greater than break time');
            }
        });

        // Test valid value
        settings.set('roundTime', 30);
        expect(settings.get('roundTime')).toBe(30);

        // Test invalid value
        expect(() => settings.set('roundTime', 4)).toThrow();

        // Remove validation rule
        settings.removeValidationRule('roundTime');
        settings.set('roundTime', 4);
        expect(settings.get('roundTime')).toBe(4);
    });

    test('should handle setting presets', () => {
        // Add preset
        settings.addPreset('Quick Game', {
            maxPlayers: 4,
            maxRounds: 5,
            roundTime: 15,
            breakTime: 2,
            difficulty: 'EASY'
        });

        // Apply preset
        settings.applyPreset('Quick Game');
        expect(settings.maxPlayers).toBe(4);
        expect(settings.maxRounds).toBe(5);
        expect(settings.roundTime).toBe(15);
        expect(settings.breakTime).toBe(2);
        expect(settings.difficulty).toBe('EASY');

        // Remove preset
        settings.removePreset('Quick Game');
        expect(() => settings.applyPreset('Quick Game')).toThrow();
    });

    test('should handle setting synchronization', () => {
        const mockSocket = {
            emit: jest.fn()
        };

        // Set socket
        settings.setSocket(mockSocket);

        // Update setting
        settings.set('maxPlayers', 6);
        expect(mockSocket.emit).toHaveBeenCalledWith('settings-update', {
            maxPlayers: 6
        });

        // Remove socket
        settings.setSocket(null);
        settings.set('maxPlayers', 8);
        expect(mockSocket.emit).toHaveBeenCalledTimes(1); // Should not emit since socket removed
    });
});
