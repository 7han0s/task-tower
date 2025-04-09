# Google Sheets Template for Task Tower

This directory contains CSV files that can be used to create the Google Sheets structure for Task Tower's online multiplayer mode.

## Structure

The Google Sheet should have two worksheets:
1. `Game State` - Contains the current game state
2. `Player Data` - Contains player information and tasks

## Setup Instructions

1. Create a new Google Sheet
2. Rename the first sheet to "Game State"
3. Import `game_state.csv` into the "Game State" sheet
4. Create a new sheet named "Player Data"
5. Import `player_data.csv` into the "Player Data" sheet

## Notes

- The "Lobby Code" in the Game State sheet will be automatically populated when a lobby is created
- The "Current Tasks" column in Player Data stores JSON arrays of tasks
- The sheet should be shared with all players in the lobby with edit permissions
