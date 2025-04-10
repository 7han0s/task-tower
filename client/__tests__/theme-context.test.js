import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeContextProvider } from '../../src/contexts/ThemeContext';
import ThemeSwitcher from '../../src/components/ThemeSwitcher';

describe('Theme Context', () => {
  it('should switch between light and dark themes', () => {
    render(
      <ThemeContextProvider>
        <ThemeSwitcher />
      </ThemeContextProvider>
    );

    const themeSwitcher = screen.getByRole('button', { name: /toggle dark\/light mode/i });
    const themeSelect = screen.getByRole('combobox', { name: /select theme/i });

    // Initial state should be light theme
    expect(themeSwitcher).toHaveTextContent('');

    // Toggle to dark mode
    fireEvent.click(themeSwitcher);
    expect(themeSwitcher).toHaveTextContent('');

    // Select different themes
    fireEvent.click(themeSelect);
    const themeOptions = screen.getAllByRole('option');
    
    // Test Pixel Dark theme
    fireEvent.click(themeOptions[0]);
    expect(screen.getByRole('combobox')).toHaveValue('pixel-dark');

    // Test Pixel Light theme
    fireEvent.click(themeSelect);
    fireEvent.click(themeOptions[1]);
    expect(screen.getByRole('combobox')).toHaveValue('pixel-light');

    // Test Clean Dark theme
    fireEvent.click(themeSelect);
    fireEvent.click(themeOptions[2]);
    expect(screen.getByRole('combobox')).toHaveValue('clean-dark');

    // Test Clean Light theme
    fireEvent.click(themeSelect);
    fireEvent.click(themeOptions[3]);
    expect(screen.getByRole('combobox')).toHaveValue('clean-light');
  });

  it('should persist theme preference in localStorage', () => {
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    render(
      <ThemeContextProvider>
        <ThemeSwitcher />
      </ThemeContextProvider>
    );

    const themeSelect = screen.getByRole('combobox', { name: /select theme/i });
    fireEvent.click(themeSelect);
    const themeOptions = screen.getAllByRole('option');

    // Select Pixel Dark theme
    fireEvent.click(themeOptions[0]);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'pixel-dark');

    // Select Clean Light theme
    fireEvent.click(themeSelect);
    fireEvent.click(themeOptions[3]);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'clean-light');
  });
});
