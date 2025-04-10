#!/bin/bash

# Test API endpoints
SERVER_URL="http://localhost:3000"

# Test game creation
echo "\nTesting game creation..."
curl -X POST \
  "$SERVER_URL/api/games" \
  -H "Content-Type: application/json" \
  -d '{"mode": "multiplayer", "settings": {"categories": ["Personal", "Chores", "Work"], "roundDuration": 25, "theme": "light", "variant": "clean"}}'

# Test player creation
GAME_ID="$(uuidgen)"
echo "\nTesting player creation..."
curl -X POST \
  "$SERVER_URL/api/games/$GAME_ID/players" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Player"}'

# Test task creation
PLAYER_ID="$(uuidgen)"
echo "\nTesting task creation..."
curl -X POST \
  "$SERVER_URL/api/players/$PLAYER_ID/tasks" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test Task", "category": "Work", "points": 50}'

# Test subtask creation
TASK_ID="$(uuidgen)"
echo "\nTesting subtask creation..."
curl -X POST \
  "$SERVER_URL/api/tasks/$TASK_ID/subtasks" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test Subtask"}'

# Test game state update
echo "\nTesting game state update..."
curl -X PUT \
  "$SERVER_URL/api/games/$GAME_ID" \
  -H "Content-Type: application/json" \
  -d '{"currentPhase": "WORK", "timeRemaining": 1500}'

# Test player update
echo "\nTesting player update..."
curl -X PUT \
  "$SERVER_URL/api/players/$PLAYER_ID" \
  -H "Content-Type: application/json" \
  -d '{"score": 100}'

# Test task update
echo "\nTesting task update..."
curl -X PUT \
  "$SERVER_URL/api/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Test subtask update
echo "\nTesting subtask update..."
SUBTASK_ID="$(uuidgen)"
curl -X PUT \
  "$SERVER_URL/api/subtasks/$SUBTASK_ID" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Test game deletion
echo "\nTesting game deletion..."
curl -X DELETE \
  "$SERVER_URL/api/games/$GAME_ID"

# Test player deletion
echo "\nTesting player deletion..."
curl -X DELETE \
  "$SERVER_URL/api/players/$PLAYER_ID"

# Test task deletion
echo "\nTesting task deletion..."
curl -X DELETE \
  "$SERVER_URL/api/tasks/$TASK_ID"

# Test subtask deletion
echo "\nTesting subtask deletion..."
curl -X DELETE \
  "$SERVER_URL/api/subtasks/$SUBTASK_ID"
