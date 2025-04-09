const { browser } = require('webdriverio');
const { expect } = require('chai');

const BROWSERS = [
    { name: 'chrome', version: 'latest' },
    { name: 'firefox', version: 'latest' },
    { name: 'safari', version: 'latest' },
    { name: 'edge', version: 'latest' }
];

describe('Cross-Browser Compatibility', () => {
    BROWSERS.forEach(browserConfig => {
        describe(`${browserConfig.name} ${browserConfig.version}`, () => {
            let driver;

            before(async () => {
                driver = await browser({
                    browserName: browserConfig.name,
                    browserVersion: browserConfig.version
                });
            });

            after(async () => {
                await driver.deleteSession();
            });

            test('should load game page correctly', async () => {
                await driver.url('http://localhost:3000');
                const title = await driver.getTitle();
                expect(title).to.equal('Task Tower');
            });

            test('should display UI components correctly', async () => {
                const playerList = await driver.$('.player-list');
                expect(await playerList.isDisplayed()).to.be.true;

                const taskList = await driver.$('.task-list');
                expect(await taskList.isDisplayed()).to.be.true;

                const connectionStatus = await driver.$('.connection-status');
                expect(await connectionStatus.isDisplayed()).to.be.true;

                const playerCount = await driver.$('.player-count');
                expect(await playerCount.isDisplayed()).to.be.true;
            });

            test('should handle player interactions', async () => {
                // Add player
                const addPlayerBtn = await driver.$('.add-player-btn');
                await addPlayerBtn.click();

                // Enter player name
                const playerNameInput = await driver.$('.player-name-input');
                await playerNameInput.setValue('Test Player');

                // Submit
                const submitBtn = await driver.$('.submit-btn');
                await submitBtn.click();

                // Verify player added
                const playerList = await driver.$('.player-list');
                const players = await playerList.$$('.player-item');
                expect(players.length).to.be.at.least(1);
            });

            test('should handle task creation', async () => {
                // Add task
                const addTaskBtn = await driver.$('.add-task-btn');
                await addTaskBtn.click();

                // Enter task details
                const taskInput = await driver.$('.task-input');
                await taskInput.setValue('Test Task');

                // Submit
                const submitBtn = await driver.$('.submit-btn');
                await submitBtn.click();

                // Verify task added
                const taskList = await driver.$('.task-list');
                const tasks = await taskList.$$('.task-item');
                expect(tasks.length).to.be.at.least(1);
            });

            test('should handle score updates', async () => {
                // Get initial score
                const scoreElement = await driver.$('.player-score');
                const initialScore = parseInt(await scoreElement.getText());

                // Update score
                const updateScoreBtn = await driver.$('.update-score-btn');
                await updateScoreBtn.click();

                // Verify score updated
                const newScore = parseInt(await scoreElement.getText());
                expect(newScore).to.be.greaterThan(initialScore);
            });

            test('should handle connection status', async () => {
                const connectionStatus = await driver.$('.connection-status');
                const status = await connectionStatus.$('.status');
                expect(await status.getText()).to.equal('Connected');
            });

            test('should handle player count', async () => {
                const playerCount = await driver.$('.player-count');
                const count = await playerCount.$('.count');
                expect(await count.getText()).to.match(/\d+/);
            });

            test('should handle animations smoothly', async () => {
                // Add task to trigger animation
                const addTaskBtn = await driver.$('.add-task-btn');
                await addTaskBtn.click();

                // Wait for animation
                await driver.pause(1000);

                // Verify animation completed
                const taskList = await driver.$('.task-list');
                const tasks = await taskList.$$('.task-item');
                expect(tasks.length).to.be.at.least(1);
            });

            test('should handle game settings', async () => {
                // Open settings
                const settingsBtn = await driver.$('.settings-btn');
                await settingsBtn.click();

                // Verify settings displayed
                const settingsPanel = await driver.$('.settings-panel');
                expect(await settingsPanel.isDisplayed()).to.be.true;

                // Change setting
                const maxPlayersInput = await settingsPanel.$('.max-players-input');
                await maxPlayersInput.setValue('6');

                // Save settings
                const saveBtn = await settingsPanel.$('.save-btn');
                await saveBtn.click();

                // Verify setting saved
                const playerCount = await driver.$('.player-count');
                const limit = await playerCount.$('.limit');
                expect(await limit.getText()).to.equal('Max Players: 6');
            });
        });
    });
});
