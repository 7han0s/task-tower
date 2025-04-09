/**
 * ui-controller.js
 * Handles all DOM manipulation and UI rendering for Task Tower
 */

const UIController = (function() {
    // Cache DOM elements (wait until DOM is loaded to initialize)
    let elements = {}; 
    
    // Initialize element references
    function cacheElements() {
        elements = {
            // Main menu elements
            mainMenu: document.getElementById('main-menu'),
            soloModeButton: document.getElementById('solo-mode-button'),
            localMultiplayerButton: document.getElementById('local-multiplayer-button'),
            onlineMultiplayerButton: document.getElementById('online-multiplayer-button'),
            
            // Setup screen elements
            setupScreen: document.getElementById('setup-screen'),
            playerCountInput: document.getElementById('player-count-input'),
            playerNameInputsContainer: document.getElementById('player-name-inputs'),
            totalRoundsInput: document.getElementById('total-rounds-input'),
            roundTimeInput: document.getElementById('round-time-input'),
            breakTimeInput: document.getElementById('break-time-input'),
            startGameButton: document.getElementById('start-game-button'),
            backToMenuButton: document.getElementById('back-to-menu-button'),
            
            // Game screen elements
            gameScreen: document.getElementById('game-screen'),
            playersArea: document.getElementById('players-area'),
            gameControls: document.getElementById('game-controls'),
            gameStatus: document.getElementById('game-status'),
            taskListContainer: document.getElementById('task-list'),
            taskPlayerSelect: document.getElementById('task-player-select'),
            gamePauseButton: document.getElementById('game-pause-button'),
            
            // Task management elements
            taskDescription: document.getElementById('task-description'),
            taskCategory: document.getElementById('task-category'),
            taskTime: document.getElementById('task-time'),
            taskBig: document.getElementById('task-big'),
            subtaskList: document.getElementById('subtask-list'),
            addTaskButton: document.getElementById('add-task'),
            addSubtaskButton: document.getElementById('add-subtask'),
            
            // Task import/export elements
            taskImportFormat: document.getElementById('task-import-format'),
            taskImport: document.getElementById('task-import'),
            importTasksButton: document.getElementById('import-tasks'),
            taskExportFormat: document.getElementById('task-export-format'),
            exportTasksButton: document.getElementById('export-tasks'),
            
            // Results screen elements
            winnerMessage: document.getElementById('winner-message'),
            playAgainButton: document.getElementById('play-again')
        };

        // Check for missing elements and log warnings
        Object.entries(elements).forEach(([name, element]) => {
            if (!element) {
                console.warn(`UI Element not found: ${name}`);
            }
        });
    }

    // Initialize audio elements
    const audio = {
        phaseChange: new Audio('sounds/phase-change.mp3'),
        timerTick: new Audio('sounds/timer-tick.mp3'),
        taskComplete: new Audio('sounds/task-complete.mp3'),
        gameStart: new Audio('sounds/game-start.mp3'),
        gameEnd: new Audio('sounds/game-end.mp3'),
        pause: new Audio('sounds/pause.mp3'),
        resume: new Audio('sounds/resume.mp3')
    };

    // Initialize animation classes
    const animations = {
        fadeIn: 'animate-fade-in',
        fadeOut: 'animate-fade-out',
        pulse: 'animate-pulse',
        scaleIn: 'animate-scale-in',
        scaleOut: 'animate-scale-out'
    };

    function playSound(sound) {
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    }

    // Private functions
    function renderPlayerNameInputs(count) {
        elements.playerNameInputsContainer.innerHTML = '';
        for (let i = 1; i <= count; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'mb-3 sm:mb-4';
            inputGroup.innerHTML = `
                <label for="player-name-${i}" class="block mb-1 sm:mb-2 text-sm sm:text-base">PLAYER ${i} NAME:</label>
                <input type="text" id="player-name-${i}" class="player-name-input w-full max-w-xs px-2 py-1 sm:px-3 sm:py-2 bg-black border border-gray-600 rounded" 
                       placeholder="Enter name" value="Player ${i}">
            `;
            elements.playerNameInputsContainer.appendChild(inputGroup);
        }
    }

    function showScreen(screenId) {
        // Hide all screens first
        [elements.mainMenu, elements.setupScreen, elements.gameScreen].forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
        // Show the requested screen
        const screenToShow = document.getElementById(screenId);
        if (screenToShow) screenToShow.classList.remove('hidden');
    }

    function createPlayerCardUI(player) {
        const playerCard = document.createElement('div');
        playerCard.id = `player-card-${player.id}`;
        playerCard.className = 'player-card p-4 border-2 border-gray-600 rounded-lg text-center flex flex-col h-full';
        playerCard.innerHTML = `
            <h4 class="text-lg font-bold mb-3 border-b border-gray-700 pb-2">${player.name}</h4>
            
            <!-- Tower container with better height constraints -->
            <div class="tower-container mx-auto mb-3 flex-grow" id="tower-${player.id}"></div>
            
            <!-- Score display -->
            <div class="text-xl mb-3 bg-gray-900 rounded py-1">Score: <span id="score-${player.id}" class="font-bold">${player.score}</span></div>

            <!-- Pending Tasks Count - Shows a summary instead of inputs -->
            <div class="pending-tasks-summary text-center mt-auto border-t border-gray-700 pt-3">
                <div class="text-sm">Pending Tasks: <span id="pending-count-${player.id}">0</span></div>
            </div>

            <!-- Pending Tasks List (Action Phase Buttons) -->
            <div class="pending-tasks-list mt-auto border-t border-gray-700 pt-3 space-y-2" id="pending-tasks-${player.id}">
                <!-- Task completion buttons added dynamically -->
            </div>
        `;
        elements.playersArea.appendChild(playerCard);
    }

    function updateTaskListsUI() {
        GameCore.players.forEach(player => {
            const taskListDiv = document.getElementById(`pending-tasks-${player.id}`);
            if (!taskListDiv) return;
            taskListDiv.innerHTML = ''; // Clear current list

            // Determine if task completion buttons should be shown and enabled
            const showCompletionButtons = (GameCore.currentPhase === 'action');
            const enableButtons = showCompletionButtons && !GameCore.actionsTakenThisRound[player.id];

            if (player.pendingTasks.length === 0) {
                if (showCompletionButtons) {
                    taskListDiv.innerHTML = '<p class="text-xs text-gray-500 italic">No tasks pending</p>';
                }
                return; // Nothing more to display
            }

            player.pendingTasks.forEach(task => {
                // During ACTION phase, show tasks as buttons
                if (showCompletionButtons) {
                    const taskButton = document.createElement('button');
                    
                    // Enhanced styling for task buttons by category
                    const categoryColors = {
                        'personal': 'border-red-500 hover:bg-red-900 hover:bg-opacity-30',
                        'chores': 'border-blue-500 hover:bg-blue-900 hover:bg-opacity-30',
                        'work': 'border-green-500 hover:bg-green-900 hover:bg-opacity-30'
                    };
                    
                    const categoryColor = categoryColors[task.category] || '';
                    
                    taskButton.className = `complete-task-btn w-full py-2 px-3 mb-2 text-sm border-2 ${categoryColor} 
                                            rounded bg-black bg-opacity-50 text-left relative overflow-hidden`;
                    taskButton.dataset.player = player.id;
                    taskButton.dataset.taskId = task.id;
                    
                    // Format the description to highlight big tasks
                    let displayDescription = task.description;
                    if (task.isBigTask && !displayDescription.startsWith('!!')) {
                        displayDescription = `<span class="big-task-marker">!!</span> ${displayDescription}`;
                    }
                    
                    // More structured content with category badge and additional info
                    let taskContent = `
                        <div class="flex justify-between items-center">
                            <span class="task-desc">${displayDescription}</span>
                            <span class="text-xs font-bold px-2 py-1 rounded ${task.category}-badge ml-2">${task.points}pt</span>
                        </div>
                    `;
                    
                    // Add time estimate if available
                    if (task.estimatedDuration) {
                        taskContent += `
                            <div class="text-xs text-gray-400 mt-1 text-left">
                                Estimated time: ${task.estimatedDuration} min
                            </div>
                        `;
                    }
                    
                    // Add subtasks if available
                    if (task.subtasks && task.subtasks.length > 0) {
                        taskContent += `
                            <div class="subtasks-container mt-2 text-left">
                                <div class="text-xs text-gray-400">Subtasks:</div>
                                <ul class="list-disc list-inside text-xs pl-2">
                        `;
                        
                        task.subtasks.forEach(subtask => {
                            taskContent += `
                                <li class="${subtask.completed ? 'line-through text-gray-500' : ''}">
                                    ${subtask.description}
                                </li>
                            `;
                        });
                        
                        taskContent += `
                                </ul>
                            </div>
                        `;
                    }
                    
                    taskButton.innerHTML = taskContent;
                    
                    taskButton.disabled = !enableButtons; // Disable if player acted or not action phase
                    taskListDiv.appendChild(taskButton);
                } else {
                    // During WORK phase (or others), just list the tasks
                    const taskItem = document.createElement('p');
                    taskItem.className = 'text-xs text-left px-1';
                    taskItem.textContent = `- ${task.description} (${task.category} - ${task.points}pt)`;
                    taskListDiv.appendChild(taskItem);
                }
            });
        });
    }

    function updateScoreUI(playerId) {
        const scoreSpan = document.getElementById(`score-${playerId}`);
        const player = GameCore.players.find(p => p.id === playerId);
        if (scoreSpan && player) {
            scoreSpan.textContent = player.score;
        }
    }

    function addBlocksToTowerUI(playerId, numBlocks, type) {
        const towerContainer = document.getElementById(`tower-${playerId}`);
        if (!towerContainer) return;
        console.log(`Adding ${numBlocks} ${type} block(s) to Player ${playerId}'s tower`);

        for (let i = 0; i < numBlocks; i++) {
            const block = document.createElement('div');
            block.className = `block ${type}`; // Assigns type for color
            towerContainer.appendChild(block); // Appends to the bottom (visually top due to flex-reverse)
        }

        // Optional: Add a subtle animation
        if (towerContainer.lastChild) {
            towerContainer.lastChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function adjustPlayerAreaLayout() {
        const numPlayers = GameCore.players.length;
        let gridColsClass = 'grid-cols-1'; // Default for 1 player
        
        if (numPlayers === 2) gridColsClass = 'md:grid-cols-2';
        else if (numPlayers === 3) gridColsClass = 'md:grid-cols-3';
        else if (numPlayers >= 4) gridColsClass = 'md:grid-cols-2 lg:grid-cols-4';

        elements.playersArea.className = `grid ${gridColsClass} gap-6 w-full`;
    }

    function updateTimerDisplay() {
        const totalDuration = (GameCore.currentPhase === 'work') 
            ? GameCore.workPhaseDuration 
            : GameCore.actionPhaseDuration;
            
        const percentage = (GameCore.phaseTimeRemaining / totalDuration) * 100;
        elements.timerBar.style.width = `${Math.max(0, percentage)}%`;
        elements.timerDisplay.textContent = `${GameCore.currentPhase.toUpperCase()} PHASE: ${GameCore.formatTime(GameCore.phaseTimeRemaining)}`;
        
        // Add animation
        elements.timerDisplay.classList.add(animations.fadeOut);
        setTimeout(() => {
            elements.timerDisplay.classList.remove(animations.fadeOut);
            elements.timerDisplay.classList.add(animations.fadeIn);
        }, 100);
        
        // Play timer tick sound
        if (GameCore.phaseTimeRemaining === 0) {
            playSound(audio.phaseChange);
        } else if (GameCore.phaseTimeRemaining % 60000 === 0) {
            playSound(audio.timerTick);
        }
    }

    function updateGameStatus(status) {
        const phaseText = document.getElementById('phase-text');
        const phaseIndicator = document.querySelector('.phase-indicator');
        
        // Update text
        phaseText.textContent = status;
        
        // Update phase indicator color
        if (status.includes('Work Phase')) {
            phaseIndicator.classList.remove('bg-blue-500');
            phaseIndicator.classList.add('bg-yellow-500');
        } else if (status.includes('Break')) {
            phaseIndicator.classList.remove('bg-yellow-500');
            phaseIndicator.classList.add('bg-blue-500');
        }
        
        // Add animation
        phaseText.classList.add(animations.fadeOut);
        setTimeout(() => {
            phaseText.classList.remove(animations.fadeOut);
            phaseText.classList.add(animations.fadeIn);
        }, 100);
    }

    // Task input/completion UI functions
    function enableTaskInput() {
        document.querySelectorAll('.task-input-section').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.add-task-btn').forEach(btn => btn.disabled = false);
    }

    function disableTaskInput() {
        document.querySelectorAll('.task-input-section').forEach(el => el.style.display = 'none');
    }

    function enableTaskInputForPlayer(playerId) {
        const inputSection = document.querySelector(`#player-card-${playerId} .task-input-section`);
        if (inputSection) inputSection.style.display = 'block';
        
        const addTaskBtn = document.querySelector(`#player-card-${playerId} .add-task-btn`);
        if (addTaskBtn) addTaskBtn.disabled = false;
    }

    function enableTaskCompletion() {
        console.log("Enabling task completion for eligible players.");
        document.querySelectorAll('.complete-task-btn').forEach(button => {
            const playerId = parseInt(button.dataset.player);
            button.disabled = !!GameCore.actionsTakenThisRound[playerId];
        });
    }

    function disableTaskCompletion() {
        console.log("Disabling all task completion buttons.");
        document.querySelectorAll('.complete-task-btn').forEach(button => {
            button.disabled = true;
        });
    }

    function disableTaskCompletionForPlayer(playerId) {
        console.log(`Disabling task completion for Player ${playerId}`);
        document.querySelectorAll(`#player-card-${playerId} .complete-task-btn`).forEach(button => {
            button.disabled = true;
        });
    }

    function displayGameResults(winners) {
        const maxScore = winners.length > 0 ? winners[0].score : 0;
        
        if (winners.length === 1) {
            elements.winnerMessage.textContent = `${winners[0].name} WINS with ${maxScore} points!`;
        } else if (winners.length > 1) {
            elements.winnerMessage.textContent = `It's a TIE between ${winners.map(p => p.name).join(' and ')} with ${maxScore} points!`;
        } else {
            elements.winnerMessage.textContent = "Game ended. Scores calculated."; // Fallback
        }

        // Show results modal
        elements.resultsScreen.style.display = 'flex';
        
        // Add animation
        elements.resultsScreen.classList.add(animations.fadeIn);
        
        // Play sound
        playSound(audio.gameEnd);
    }

    // Initialize Game UI
    function initializeGameUI() {
        // Initialize game screen elements
        elements.gameScreen.classList.remove('hidden');
        elements.setupScreen.classList.add('hidden');
        elements.mainMenu.classList.add('hidden');
        
        // Initialize game state display
        updateGameStateDisplay();
        
        // Initialize task management
        setupUniversalTaskManagement();
        
        // Initialize game controls
        setupGameControls();
        
        elements.playersArea.innerHTML = '';
        elements.totalRoundsDisplay.textContent = GameCore.totalRounds;

        GameCore.players.forEach(player => {
            createPlayerCardUI(player);
        });

        // Adjust grid columns based on player count for better layout
        adjustPlayerAreaLayout();
        
        // Play sound
        playSound(audio.gameStart);
    }

    // Setup Game Controls
    function setupGameControls() {
        // Add event listener for solo mode button
        elements.soloModeButton?.addEventListener('click', () => {
            // Ensure at least 1 player for solo mode
            const playerCount = parseInt(elements.playerCountInput.value);
            if (playerCount < 1) {
                alert('Solo mode requires at least 1 player');
                return;
            }
            
            // Initialize game with solo mode settings
            GameCore.initializeGame({
                mode: 'solo',
                players: playerCount,
                rounds: parseInt(elements.totalRoundsInput.value)
            });
            
            // Update multiplayer button state
            elements.localMultiplayerButton.disabled = playerCount < 2;
        });

        // Add event listener for local multiplayer button
        elements.localMultiplayerButton?.addEventListener('click', () => {
            // Ensure at least 2 players for multiplayer
            const playerCount = parseInt(elements.playerCountInput.value);
            if (playerCount < 2) {
                alert('Multiplayer requires at least 2 players');
                return;
            }

            // Initialize lobby in local mode
            const lobbyInfo = LobbyManager.init(false);
            console.log('Initialized local multiplayer:', lobbyInfo);

            // Initialize sync in local mode
            const syncInfo = SyncManager.init(false);
            console.log('Initialized local sync:', syncInfo);

            // Initialize game with local multiplayer settings
            GameCore.initializeGame({
                mode: 'multiplayer',
                players: playerCount,
                rounds: parseInt(elements.totalRoundsInput.value),
                isOnline: false
            });

            // Add game state listener
            GameCore.addGameStateListener(updateUI);
        });

        // Add event listener for online multiplayer button
        elements.onlineMultiplayerButton?.addEventListener('click', () => {
            // Ensure at least 2 players for multiplayer
            const playerCount = parseInt(elements.playerCountInput.value);
            if (playerCount < 2) {
                alert('Multiplayer requires at least 2 players');
                return;
            }

            // Check if user is authenticated with Google
            if (typeof gapi !== 'undefined' && gapi.auth2) {
                const authInstance = gapi.auth2.getAuthInstance();
                if (!authInstance.isSignedIn.get()) {
                    authInstance.signIn().then(() => {
                        handleOnlineMultiplayer(playerCount);
                    }).catch(error => {
                        console.error('Google sign-in failed:', error);
                        alert('Failed to sign in with Google. Please try again.');
                    });
                } else {
                    handleOnlineMultiplayer(playerCount);
                }
            } else {
                alert('Google API not loaded. Please refresh the page and try again.');
            }
        });

        // Function to handle online multiplayer after authentication
        function handleOnlineMultiplayer(playerCount) {
            // Initialize lobby in online mode
            const lobbyInfo = LobbyManager.init(true);
            console.log('Initialized online multiplayer:', lobbyInfo);

            // Create lobby and get sheet ID
            LobbyManager.createLobby().then(result => {
                if (!result.success) {
                    alert('Failed to create lobby: ' + result.error);
                    return;
                }

                if (result.isHost) {
                    // Host creates Google Sheet
                    const sheetUrl = result.sheetUrl;
                    
                    // Display sheet URL to host
                    const sheetUrlElement = document.createElement('div');
                    sheetUrlElement.className = 'lobby-code';
                    sheetUrlElement.innerHTML = `
                        <h3>Google Sheet URL:</h3>
                        <p><a href="${sheetUrl}" target="_blank">${sheetUrl}</a></p>
                        <p>Share this URL with other players to join your lobby.</p>
                    `;
                    document.getElementById('lobby-info').appendChild(sheetUrlElement);
                }

                // Initialize sync in online mode
                const syncInfo = SyncManager.init(true);
                console.log('Initialized online sync:', syncInfo);

                // Initialize game with online multiplayer settings
                GameCore.initializeGame({
                    mode: 'multiplayer',
                    players: playerCount,
                    rounds: parseInt(elements.totalRoundsInput.value),
                    isOnline: true
                });

                // Add game state listener
                GameCore.addGameStateListener(updateUI);
            }).catch(error => {
                console.error('Error creating lobby:', error);
                alert('Failed to create lobby. Please try again.');
            });
        }

        // Add event listener for game pause button
        elements.gamePauseButton?.addEventListener('click', () => {
            if (GameCore.gamePaused) {
                GameCore.resumeGame();
                elements.gamePauseButton.textContent = 'Pause Game';
                playSound(audio.resume);
            } else {
                GameCore.pauseGame();
                elements.gamePauseButton.textContent = 'Resume Game';
                playSound(audio.pause);
            }
        });

        // Function to update the UI based on game state
        function updateUI() {
            const gameState = GameCore.getGameState();
            
            // Update phase display
            elements.phaseDisplay.textContent = gameState.currentPhase;
            
            // Update round display
            elements.roundDisplay.textContent = `Round ${gameState.currentRound} of ${gameState.totalRounds}`;
            
            // Update timer
            if (typeof window.GameCore !== 'undefined') {
                window.GameCore.updateTimerDisplay();
            }
            
            // Update player info
            const playerList = document.getElementById('player-list');
            playerList.innerHTML = '';
            
            gameState.players.forEach(player => {
                const playerElement = document.createElement('div');
                playerElement.className = 'player-card';
                playerElement.innerHTML = `
                    <h3>Player ${player.id}</h3>
                    <p>Score: ${player.score}</p>
                    <div class="task-list">
                        ${player.pendingTasks.map(task => `
                            <div class="task-item">
                                <span>${task.description}</span>
                                <button onclick="handleTaskCompletion(${player.id}, ${task.id})">Complete</button>
                            </div>
                        `).join('')}
                    </div>
                `;
                playerList.appendChild(playerElement);
            });
        }
    }

    // Render Player Name Inputs
    function renderPlayerNameInputs(count) {
        elements.playerNameInputsContainer.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'mb-4';
            inputGroup.innerHTML = `
                <label for="player-name-${i}" class="block mb-2">PLAYER ${i} NAME:</label>
                <input type="text" id="player-name-${i}" 
                       class="w-64 px-2 py-1 bg-black border border-gray-600 rounded text-white"
                       placeholder="Enter name" value="Player ${i}">
            `;
            elements.playerNameInputsContainer.appendChild(inputGroup);
        }
    }

    // Update Game State Display
    function updateGameStateDisplay() {
        // Update player display
        elements.playersArea.innerHTML = '';
        GameCore.players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-card mb-4 p-4 bg-gray-800 rounded-lg';
            
            // Add current player indicator
            const isCurrentPlayer = index === GameCore.currentPlayerIndex;
            if (isCurrentPlayer) {
                playerElement.classList.add('border-2', 'border-blue-500');
            }
            
            playerElement.innerHTML = `
                <h3 class="text-lg font-bold mb-2">Player ${index + 1}: ${player.name}</h3>
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Points:</span>
                        <span class="font-bold">${player.points}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Tasks Completed:</span>
                        <span class="font-bold">${player.tasksCompleted}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Current Round:</span>
                        <span class="font-bold">${GameCore.currentRound}/${GameCore.totalRounds}</span>
                    </div>
                    ${isCurrentPlayer ? `
                    <div class="flex justify-between items-center">
                        <span class="text-sm">Dice Roll:</span>
                        <span class="font-bold">${player.currentDiceRoll || 'Waiting...'}</span>
                    </div>
                    ` : ''}
                </div>
            `;
            
            elements.playersArea.appendChild(playerElement);
        });

        // Update game status
        if (GameCore.gamePaused) {
            updateGameStatus('Game Paused');
        } else {
            updateGameStatus(`Round ${GameCore.currentRound} - ${GameCore.currentPhase}`);
        }
    }

    // Setup Main Menu navigation
    function setupMainMenuNavigation() {
        elements.soloModeButton?.addEventListener('click', () => {
            elements.setupScreen.classList.remove('hidden');
            elements.mainMenu.classList.add('hidden');
        });

        elements.localMultiplayerButton?.addEventListener('click', () => {
            elements.setupScreen.classList.remove('hidden');
            elements.mainMenu.classList.add('hidden');
        });

        elements.onlineMultiplayerButton?.addEventListener('click', () => {
            elements.setupScreen.classList.remove('hidden');
            elements.mainMenu.classList.add('hidden');
        });

        elements.backToMenuButton?.addEventListener('click', () => {
            elements.setupScreen.classList.add('hidden');
            elements.mainMenu.classList.remove('hidden');
        });
    }

    // Setup Game Setup
    function setupGameSetup() {
        // Add event listener for player count change
        elements.playerCountInput?.addEventListener('change', () => {
            const playerCount = parseInt(elements.playerCountInput.value);
            
            // Update player name inputs
            renderPlayerNameInputs(playerCount);
            
            // Update multiplayer button state
            elements.localMultiplayerButton.disabled = playerCount < 2;
        });

        // Add event listener for start game
        elements.startGameButton?.addEventListener('click', () => {
            const playerCount = parseInt(elements.playerCountInput.value);
            const totalRounds = parseInt(elements.totalRoundsInput.value);
            const roundTime = parseInt(elements.roundTimeInput.value);
            const breakTime = parseInt(elements.breakTimeInput.value);

            // Initialize game
            GameCore.initializeGame({
                players: playerCount,
                rounds: totalRounds,
                roundTime: roundTime,
                breakTime: breakTime
            });

            // Initialize UI
            initializeGameUI();
        });
    }

    // Setup Universal Task Management
    function setupUniversalTaskManagement() {
        if (!elements.universalTaskSection || !elements.taskPlayerSelect || !elements.taskDescription ||
            !elements.taskCategory || !elements.addTaskButton) {
            console.warn("Universal task management elements missing");
            return;
        }
        
        // Populate player select dropdown when game starts
        updatePlayerSelectDropdown = function() {
            if (!elements.taskPlayerSelect) return;
            
            elements.taskPlayerSelect.innerHTML = '';
            GameCore.players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = player.name;
                elements.taskPlayerSelect.appendChild(option);
            });
        };
        
        // Add subtask functionality
        elements.addSubtaskBtn?.addEventListener('click', () => {
            // Make sure the subtask list is visible
            const subtasksSection = elements.subtaskList.closest('.subtasks-section');
            if (subtasksSection && subtasksSection.classList.contains('hidden')) {
                subtasksSection.classList.remove('hidden');
            }
            
            const subtaskInput = document.createElement('div');
            subtaskInput.className = 'subtask-item flex items-center mb-2';
            subtaskInput.innerHTML = `
                <input type="text" class="subtask-text flex-grow px-2 py-1 text-xs bg-black border border-gray-600 rounded" 
                       placeholder="Subtask description">
                <button class="remove-subtask-btn ml-2 px-2 text-xs border border-gray-600 rounded">×</button>
            `;
            
            elements.subtaskList.appendChild(subtaskInput);
            
            // Focus the new input
            const input = subtaskInput.querySelector('.subtask-text');
            if (input) input.focus();
            
            // Add remove event handler
            const removeBtn = subtaskInput.querySelector('.remove-subtask-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    subtaskInput.remove();
                    
                    // If no more subtasks, hide the subtask section if it's empty
                    if (elements.subtaskList.children.length === 0 && subtasksSection) {
                        subtasksSection.classList.add('hidden');
                    }
                });
            }
        });
        
        // Add task button event handler
        elements.addTaskButton.addEventListener('click', () => {
            if (GameCore.currentPhase !== 'work') {
                alert("Tasks can only be added during the Work Phase");
                return;
            }
            
            const playerId = elements.taskPlayerSelect.value;
            const description = elements.taskDescription.value.trim();
            const category = elements.taskCategory.value;
            const estimatedTime = elements.taskTime.value ? parseInt(elements.taskTime.value) : null;
            const isBigTask = elements.taskBig.checked;
            
            if (!description) {
                alert("Please enter a task description");
                return;
            }
            
            // Create task data object
            const taskData = {
                description: isBigTask ? `!! ${description}` : description,
                category,
                playerId, 
                estimatedDuration: estimatedTime,
                isBigTask
            };
            
            // Create the task
            const newTask = TaskManager.createTask(taskData);
            
            if (!newTask) {
                console.error('Failed to create task');
                return;
            }
            
            console.log('Task created successfully:', newTask);
            
            // Add any subtasks
            if (elements.subtaskList) {
                const subtaskInputs = elements.subtaskList.querySelectorAll('.subtask-text');
                let subtasksAdded = 0;
                
                subtaskInputs.forEach(input => {
                    const subtaskDesc = input.value.trim();
                    if (subtaskDesc) {
                        const subtask = TaskManager.addSubtaskToTask(newTask.id, subtaskDesc);
                        if (subtask) subtasksAdded++;
                    }
                });
                
                console.log(`Added ${subtasksAdded} subtasks to task ${newTask.id}`);
                
                // Clear subtask list
                elements.subtaskList.innerHTML = '';
                
                // Hide subtasks section
                const subtasksSection = elements.subtaskList.closest('.subtasks-section');
                if (subtasksSection) subtasksSection.classList.add('hidden');
            }
            
            // Clear inputs
            elements.taskDescription.value = '';
            elements.taskTime.value = '';
            elements.taskBig.checked = false;
            
            // Update assigned tasks display
            updateAssignedTasksDisplay();
        });
        
        // Method to update the assigned tasks display
        updateAssignedTasksDisplay = function() {
            if (!elements.assignedTasksContainer) return;
            
            elements.assignedTasksContainer.innerHTML = '';
            
            // Group tasks by player
            GameCore.players.forEach(player => {
                if (player.pendingTasks.length === 0) return;
                
                const playerTasksElement = document.createElement('div');
                playerTasksElement.className = 'player-tasks p-3 border border-gray-700 rounded bg-black bg-opacity-50';
                
                let taskHTML = `<h4 class="text-sm font-bold mb-2">${player.name}'s Tasks:</h4><ul class="space-y-1">`;
                
                player.pendingTasks.forEach(task => {
                    let displayDescription = task.description;
                    if (task.isBigTask && !displayDescription.startsWith('!!')) {
                        displayDescription = `<span class="big-task-marker">!!</span> ${displayDescription}`;
                    }
                    
                    taskHTML += `
                        <li class="text-xs py-1 border-b border-gray-800">
                            <div class="flex justify-between">
                                <span>${displayDescription}</span>
                                <span class="text-xs font-bold px-2 py-1 rounded ${task.category}-badge ml-2">${task.points}pt</span>
                            </div>
                    `;
                    
                    if (task.estimatedDuration) {
                        taskHTML += `<div class="text-gray-500 text-xs">Est: ${task.estimatedDuration} min</div>`;
                    }
                    
                    if (task.subtasks.length > 0) {
                        taskHTML += `
                            <div class="ml-3 mt-1">`;
                        task.subtasks.forEach(subtask => {
                            taskHTML += `<div class="text-xs text-gray-400">⤷ ${subtask.description}</div>`;
                        });
                        taskHTML += `</div>`;
                    }
                    
                    taskHTML += `</li>`;
                });
                
                taskHTML += `</ul>`;
                playerTasksElement.innerHTML = taskHTML;
                elements.assignedTasksContainer.appendChild(playerTasksElement);
            });
            
            // Show message if no tasks
            if (elements.assignedTasksContainer.children.length === 0) {
                elements.assignedTasksContainer.innerHTML = `
                    <div class="text-center py-5 text-gray-500">
                        <p>No tasks assigned yet.</p>
                        <p class="text-xs mt-2">Add tasks above during the Work Phase</p>
                    </div>
                `;
            }
        };
        
        // Add event listener for task import
        elements.importTasksButton?.addEventListener('click', async () => {
            const fileInput = elements.taskImport;
            if (!fileInput.files.length) {
                alert('Please select a file to import');
                return;
            }

            try {
                const { tasks, preview } = await TaskImporter.importTasks(fileInput.files[0]);
                
                // Show preview dialog
                const previewModal = document.createElement('div');
                previewModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                
                const modalContent = document.createElement('div');
                modalContent.className = 'bg-gray-800 p-6 rounded-lg max-w-2xl w-full';
                
                const header = document.createElement('h2');
                header.className = 'text-xl font-bold mb-4 text-white';
                header.textContent = `Preview ${preview.length} Imported Tasks`;
                
                const taskList = document.createElement('div');
                taskList.className = 'space-y-4';
                
                preview.forEach((task, index) => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'border border-gray-700 rounded-lg p-4';
                    
                    const taskHeader = document.createElement('div');
                    taskHeader.className = 'flex justify-between items-start';
                    
                    const description = document.createElement('div');
                    description.className = 'text-white';
                    description.textContent = `Task ${index + 1}: ${task.description}`;
                    
                    const category = document.createElement('span');
                    category.className = `${task.category}-badge px-2 py-1 rounded text-xs`;
                    category.textContent = task.category;
                    
                    taskHeader.appendChild(description);
                    taskHeader.appendChild(category);
                    
                    const time = document.createElement('div');
                    time.className = 'text-gray-400 mt-1';
                    time.textContent = `${task.time} minutes`;
                    
                    const big = document.createElement('div');
                    big.className = 'text-gray-400 mt-1';
                    big.textContent = task.big ? 'Big Task' : 'Regular Task';
                    
                    taskItem.appendChild(taskHeader);
                    taskItem.appendChild(time);
                    taskItem.appendChild(big);
                    
                    taskList.appendChild(taskItem);
                });
                
                const buttons = document.createElement('div');
                buttons.className = 'flex justify-end space-x-4 mt-4';
                
                const cancelButton = document.createElement('button');
                cancelButton.className = 'px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500';
                cancelButton.textContent = 'Cancel';
                cancelButton.addEventListener('click', () => {
                    previewModal.remove();
                });
                
                const importButton = document.createElement('button');
                importButton.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
                importButton.textContent = 'Import Tasks';
                importButton.addEventListener('click', () => {
                    // Clear existing tasks
                    elements.taskDescription.value = '';
                    elements.taskCategory.value = 'personal';
                    elements.taskTime.value = '';
                    elements.taskBig.checked = false;
                    elements.subtaskList.innerHTML = '';

                    // Add each imported task
                    tasks.forEach(task => {
                        // Set form values
                        elements.taskDescription.value = task.description;
                        elements.taskCategory.value = task.category;
                        elements.taskTime.value = task.time;
                        elements.taskBig.checked = task.big;

                        // Add task
                        handleAddTask(elements.taskPlayerSelect.value);
                    });

                    previewModal.remove();
                    alert(`Successfully imported ${tasks.length} tasks!`);
                });
                
                buttons.appendChild(cancelButton);
                buttons.appendChild(importButton);
                
                modalContent.appendChild(header);
                modalContent.appendChild(taskList);
                modalContent.appendChild(buttons);
                
                previewModal.appendChild(modalContent);
                document.body.appendChild(previewModal);
            } catch (error) {
                alert(`Error importing tasks: ${error.message}`);
                console.error('Task import error:', error);
            }
        });
        
        // Add event listener to clear form when a new file is selected
        elements.taskImport?.addEventListener('change', () => {
            // Clear any previous error messages
            elements.taskDescription.value = '';
            elements.taskCategory.value = 'personal';
            elements.taskTime.value = '';
            elements.taskBig.checked = false;
            elements.subtaskList.innerHTML = '';
        });
        
        // Add event listener for task export
        elements.exportTasksButton?.addEventListener('click', () => {
            const tasks = Array.from(elements.taskListContainer.children)
                .map(taskElement => {
                    const task = {
                        description: taskElement.querySelector('.task-description').textContent,
                        category: taskElement.querySelector('.task-category').textContent,
                        time: parseInt(taskElement.querySelector('.task-time')?.textContent) || 0,
                        big: taskElement.querySelector('.task-big')?.textContent === 'Big Task'
                    };
                    
                    // Add subtasks if they exist
                    const subtasks = taskElement.querySelectorAll('.subtask-description');
                    if (subtasks.length > 0) {
                        task.subtasks = Array.from(subtasks).map(subtask => subtask.textContent);
                    }
                    
                    return task;
                });

            if (tasks.length === 0) {
                alert('No tasks to export!');
                return;
            }

            try {
                TaskImporter.exportTasks(tasks, elements.taskExportFormat.value);
                alert(`Successfully exported ${tasks.length} tasks!`);
            } catch (error) {
                alert(`Error exporting tasks: ${error.message}`);
                console.error('Task export error:', error);
            }
        });
    }
    
    // Initialize UI
    function init() {
        // Cache all elements
        cacheElements();

        // Setup main menu navigation
        setupMainMenuNavigation();

        // Setup game setup screen
        setupGameSetup();

        // Setup game screen
        setupGameScreen();

        // Setup task management
        setupUniversalTaskManagement();

        // Setup game controls
        setupGameControls();

        console.log('UI Controller initialized');
    }

    // Public API
    return {
        // Initialize UI
        init: init,
        
        // Updating the UI for different game phases
        updateForWorkPhase: function() {
            enableTaskInput();
            disableTaskCompletion();
            updateTaskListsUI();
            updateTimerDisplay();
        },
        
        updateForActionPhase: function() {
            disableTaskInput();
            enableTaskCompletion();
            updateTaskListsUI();
            updateTimerDisplay();
        },
        
        // Initialize How to Play modal
        initHowToPlayModal: function() {
            if (!elements.howToPlayModal || !elements.closeHowToPlayButton || !elements.closeModalButton) {
                console.warn("How to Play modal elements missing");
                return;
            }
            
            // Main menu How to Play button
            elements.howToPlayButton?.addEventListener('click', () => {
                elements.howToPlayModal.classList.remove('hidden');
            });
            
            // In-game How to Play button
            elements.gameInfoButton?.addEventListener('click', () => {
                elements.howToPlayModal.classList.remove('hidden');
            });
            
            // Close modal buttons
            elements.closeHowToPlayButton.addEventListener('click', () => {
                elements.howToPlayModal.classList.add('hidden');
            });
            
            elements.closeModalButton.addEventListener('click', () => {
                elements.howToPlayModal.classList.add('hidden');
            });
            
            // Close modal on outside click
            elements.howToPlayModal.addEventListener('click', (e) => {
                if (e.target === elements.howToPlayModal) {
                    elements.howToPlayModal.classList.add('hidden');
                }
            });
            
            // Close modal on Escape key press
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !elements.howToPlayModal.classList.contains('hidden')) {
                    elements.howToPlayModal.classList.add('hidden');
                }
            });
        },
        
        // Setup Main Menu navigation
        setupMainMenuNavigation: setupMainMenuNavigation,
        
        // Setup Game Setup
        setupGameSetup: setupGameSetup,
        
        // Setup Game Controls
        setupGameControls: setupGameControls,
        
        // Handle task-related actions
        handleAddTask: function(playerId) {
            const descriptionInput = document.getElementById(`task-desc-${playerId}`);
            const categorySelect = document.getElementById(`task-category-${playerId}`);
            const timeEstInput = document.getElementById(`task-time-${playerId}`);
            const bigTaskCheckbox = document.getElementById(`task-big-${playerId}`);
            const subtaskArea = document.getElementById(`subtask-area-${playerId}`);
            const subtaskList = document.getElementById(`subtask-list-${playerId}`);
            
            if (!descriptionInput || !categorySelect) {
                console.error("UI elements not found for adding task for player", playerId);
                return;
            }

            const description = descriptionInput.value.trim();
            const category = categorySelect.value;
            // Get optional fields
            const estimatedDuration = timeEstInput && timeEstInput.value ? parseInt(timeEstInput.value) : null;
            const isBigTask = bigTaskCheckbox && bigTaskCheckbox.checked;

            if (!description) {
                alert("Please enter a task description.");
                return;
            }

            // Create the task with enhanced properties
            const taskData = {
                description: isBigTask ? `!! ${description}` : description,
                category,
                playerId,
                estimatedDuration,
                isBigTask
            };
            
            // Create the main task
            const newTask = TaskManager.createTask(taskData);
            
            // Add any subtasks if they exist
            if (newTask && subtaskArea && !subtaskArea.classList.contains('hidden') && subtaskList) {
                const subtaskItems = subtaskList.querySelectorAll('.subtask-item');
                subtaskItems.forEach(item => {
                    const subtaskDesc = item.querySelector('.subtask-desc').textContent;
                    if (subtaskDesc) {
                        TaskManager.addSubtaskToTask(newTask.id, subtaskDesc);
                    }
                });
                
                // Clear the subtask list
                subtaskList.innerHTML = '';
                
                // Hide the subtask area
                subtaskArea.classList.add('hidden');
                const toggleIcon = document.querySelector(`#subtask-toggle-${playerId} .subtask-toggle-icon`);
                if (toggleIcon) toggleIcon.textContent = '+';
            }
            
            // Clear inputs
            descriptionInput.value = '';
            if (timeEstInput) timeEstInput.value = '';
            if (bigTaskCheckbox) bigTaskCheckbox.checked = false;
            
            // Update the task list UI
            updateTaskListsUI();
        },
        
        handleCompleteTask: function(playerId, taskId) {
            // Complete the task and get the result
            const completedTask = GameCore.handleTaskCompletion(playerId, taskId);
            
            if (completedTask) {
                // Update UI
                updateScoreUI(playerId);
                addBlocksToTowerUI(playerId, completedTask.points, completedTask.category);
                updateTaskListsUI();
                disableTaskCompletionForPlayer(playerId);
            }
        },
        
        // Handle adding a subtask to a task
        handleAddSubtask: function(playerId) {
            const subtaskInput = document.getElementById(`subtask-input-${playerId}`);
            const subtaskList = document.getElementById(`subtask-list-${playerId}`);
            
            if (!subtaskInput || !subtaskList) {
                console.error("Subtask UI elements not found for player", playerId);
                return;
            }
            
            const subtaskDesc = subtaskInput.value.trim();
            if (!subtaskDesc) return;
            
            // Create a visual representation of the subtask (not yet saved to a task)
            const subtaskElement = document.createElement('div');
            subtaskElement.className = 'subtask-item';
            subtaskElement.innerHTML = `
                <span class="subtask-desc flex-grow">${subtaskDesc}</span>
                <button class="subtask-remove-btn ml-2 text-xs bg-black border border-gray-600 rounded px-1">×</button>
            `;
            
            // Add event listener to remove button
            const removeBtn = subtaskElement.querySelector('.subtask-remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    subtaskElement.remove();
                });
            }
            
            subtaskList.appendChild(subtaskElement);
            subtaskInput.value = '';
            subtaskInput.focus();
        },
        
        // Update timer display
        updateTimerUI: function() {
            updateTimerDisplay();
        },
        
        // Show game results
        showResults: function(winners) {
            displayGameResults(winners);
        },
        
        // Utility methods that other modules might need
        showScreen: showScreen,
        adjustPlayerAreaLayout: adjustPlayerAreaLayout
    };
})();

// Export to window scope to be accessible by other modules
window.UIController = UIController;
