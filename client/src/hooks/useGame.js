import { useState, useEffect } from 'react';
import gameSheets from '../services/game-sheets';

export const useGame = () => {
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchGameState = async (lobbyCode = null) => {
        try {
            const state = await gameSheets.fetchGameState(lobbyCode);
            setGameState(state);
            setError('');
        } catch (err) {
            console.error('Error fetching game state:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const saveGameState = async (gameState, mode, lobbyCode = null) => {
        try {
            await gameSheets.saveGameState(gameState, mode, lobbyCode);
            setGameState(gameState);
        } catch (error) {
            console.error('Error saving game state:', error);
            setError(error.message);
        }
    };

    return {
        gameState,
        error,
        loading,
        fetchGameState,
        saveGameState
    };
};
