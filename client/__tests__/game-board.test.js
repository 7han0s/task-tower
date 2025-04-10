import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeContextProvider } from '../../src/contexts/ThemeContext';
import GameBoard from '../../src/components/GameBoard';

describe('Game Board Component', () => {
  const mockGameState = {
    lobbyCode: 'TEST123',
    currentPhase: 'WORK',
    timeRemaining: 1500,
    settings: {
      categories: ['Personal', 'Chores', 'Work'],
    },
    players: [
      {
        id: 1,
        name: 'Player 1',
        score: 0,
        tasks: [],
      },
    ],
  };

  const mockProps = {
    mode: 'multiplayer',
    lobbyCode: 'TEST123',
    onSettingsOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.spyOn(window, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGameState),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render game board with initial state', async () => {
    render(
      <ThemeContextProvider>
        <GameBoard {...mockProps} />
      </ThemeContextProvider>
    );

    // Wait for game state to load
    await waitFor(() => {
      expect(screen.getByText('WORK')).toBeInTheDocument();
    });

    // Verify phase indicator
    expect(screen.getByText('WORK')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();

    // Verify player card
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Score

    // Verify category sections
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Chores')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('should handle adding a task', async () => {
    render(
      <ThemeContextProvider>
        <GameBoard {...mockProps} />
      </ThemeContextProvider>
    );

    // Wait for game state to load
    await waitFor(() => {
      expect(screen.getByText('WORK')).toBeInTheDocument();
    });

    // Add task to Personal category
    const personalSection = screen.getByText('Personal').closest('.category-section');
    const taskInput = personalSection.querySelector('.task-input');
    const addBtn = personalSection.querySelector('.add-btn');

    fireEvent.change(taskInput, { target: { value: 'Test Task' } });
    fireEvent.click(addBtn);

    // Verify task was added
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  it('should handle adding and completing subtasks', async () => {
    render(
      <ThemeContextProvider>
        <GameBoard {...mockProps} />
      </ThemeContextProvider>
    );

    // Wait for game state to load
    await waitFor(() => {
      expect(screen.getByText('WORK')).toBeInTheDocument();
    });

    // Add task to Personal category
    const personalSection = screen.getByText('Personal').closest('.category-section');
    const taskInput = personalSection.querySelector('.task-input');
    const addBtn = personalSection.querySelector('.add-btn');

    fireEvent.change(taskInput, { target: { value: 'Test Task' } });
    fireEvent.click(addBtn);

    // Add subtask
    const subtaskInput = screen.getByPlaceholderText('Add subtask...');
    fireEvent.change(subtaskInput, { target: { value: 'Test Subtask' } });
    fireEvent.keyDown(subtaskInput, { key: 'Enter' });

    // Complete subtask
    const subtaskCheckbox = screen.getByRole('checkbox');
    fireEvent.click(subtaskCheckbox);

    // Verify subtask is completed
    await waitFor(() => {
      expect(screen.getByText('Test Subtask')).toHaveClass('completed');
    });
  });

  it('should handle theme switching', () => {
    render(
      <ThemeContextProvider>
        <GameBoard {...mockProps} />
      </ThemeContextProvider>
    );

    // Verify initial theme
    expect(document.body).toHaveClass('light');

    // Toggle dark mode
    const themeSwitcher = screen.getByRole('button', { name: /toggle dark/light mode/i });
    fireEvent.click(themeSwitcher);

    // Verify dark mode
    expect(document.body).toHaveClass('dark');

    // Select different theme
    const themeSelect = screen.getByRole('combobox', { name: /select theme/i });
    fireEvent.click(themeSelect);
    const themeOptions = screen.getAllByRole('option');
    fireEvent.click(themeOptions[0]); // Pixel Dark

    // Verify theme change
    expect(document.body).toHaveClass('pixel');
    expect(document.body).toHaveClass('dark');
  });
});
