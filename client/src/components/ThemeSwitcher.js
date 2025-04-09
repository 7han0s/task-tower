import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSwitcher = () => {
    const { theme, isDarkMode, toggleDarkMode, switchTheme } = useTheme();

    const themes = [
        { name: 'Pixel Dark', value: 'pixel-dark' },
        { name: 'Pixel Light', value: 'pixel-light' },
        { name: 'Clean Dark', value: 'clean-dark' },
        { name: 'Clean Light', value: 'clean-light' }
    ];

    const handleThemeChange = (e) => {
        const selectedTheme = e.target.value;
        switchTheme(selectedTheme);
    };

    return (
        <div className="theme-switcher">
            <div className="theme-toggle">
                <button 
                    onClick={toggleDarkMode}
                    className="btn-secondary"
                >
                    {isDarkMode ? '☀️' : '🌙'}
                </button>
            </div>
            <div className="theme-selector">
                <select 
                    value={theme}
                    onChange={handleThemeChange}
                    className="theme-select"
                >
                    {themes.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ThemeSwitcher;
