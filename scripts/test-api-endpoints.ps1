#!/bin/pwsh

# Test API endpoints
$SERVER_URL = "http://localhost:3001"

# Test game creation
Write-Host "`nTesting game creation..."
Invoke-WebRequest -Method POST -Uri "$SERVER_URL/api/games" -ContentType "application/json" -Body '{"mode": "multiplayer", "settings": {"categories": ["Personal", "Chores", "Work"], "roundDuration": 25, "theme": "light", "variant": "clean"}}'

# Test player creation
$GAME_ID = [guid]::NewGuid()
Write-Host "`nTesting player creation..."
Invoke-WebRequest -Method POST -Uri "$SERVER_URL/api/games/$GAME_ID/players" -ContentType "application/json" -Body '{"name": "Test Player"}'

# Test task creation
$PLAYER_ID = [guid]::NewGuid()
Write-Host "`nTesting task creation..."
Invoke-WebRequest -Method POST -Uri "$SERVER_URL/api/players/$PLAYER_ID/tasks" -ContentType "application/json" -Body '{"text": "Test Task", "category": "Work", "points": 50}'

# Test subtask creation
$TASK_ID = [guid]::NewGuid()
Write-Host "`nTesting subtask creation..."
Invoke-WebRequest -Method POST -Uri "$SERVER_URL/api/tasks/$TASK_ID/subtasks" -ContentType "application/json" -Body '{"text": "Test Subtask"}'

# Test game state update
Write-Host "`nTesting game state update..."
Invoke-WebRequest -Method PUT -Uri "$SERVER_URL/api/games/$GAME_ID" -ContentType "application/json" -Body '{"currentPhase": "WORK", "timeRemaining": 1500}'

# Test player update
Write-Host "`nTesting player update..."
Invoke-WebRequest -Method PUT -Uri "$SERVER_URL/api/players/$PLAYER_ID" -ContentType "application/json" -Body '{"score": 100}'

# Test task update
Write-Host "`nTesting task update..."
Invoke-WebRequest -Method PUT -Uri "$SERVER_URL/api/tasks/$TASK_ID" -ContentType "application/json" -Body '{"completed": true}'

# Test subtask update
$SUBTASK_ID = [guid]::NewGuid()
Write-Host "`nTesting subtask update..."
Invoke-WebRequest -Method PUT -Uri "$SERVER_URL/api/subtasks/$SUBTASK_ID" -ContentType "application/json" -Body '{"completed": true}'

# Test game deletion
Write-Host "`nTesting game deletion..."
Invoke-WebRequest -Method DELETE -Uri "$SERVER_URL/api/games/$GAME_ID"

# Test player deletion
Write-Host "`nTesting player deletion..."
Invoke-WebRequest -Method DELETE -Uri "$SERVER_URL/api/players/$PLAYER_ID"

# Test task deletion
Write-Host "`nTesting task deletion..."
Invoke-WebRequest -Method DELETE -Uri "$SERVER_URL/api/tasks/$TASK_ID"

# Test subtask deletion
Write-Host "`nTesting subtask deletion..."
Invoke-WebRequest -Method DELETE -Uri "$SERVER_URL/api/subtasks/$SUBTASK_ID"
