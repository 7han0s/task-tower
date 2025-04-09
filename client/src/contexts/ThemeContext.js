import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('pixel-dark');
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const savedTheme = localStorage.getItem('taskTowerTheme');
        if (savedTheme) {
            setTheme(savedTheme);
            setIsDarkMode(savedTheme === 'pixel-dark' || savedTheme === 'clean-dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const currentTheme = theme;
        const newTheme = currentTheme.includes('dark') ? currentTheme.replace('dark', 'light') : currentTheme.replace('light', 'dark');
        setTheme(newTheme);
        setIsDarkMode(!isDarkMode);
        localStorage.setItem('taskTowerTheme', newTheme);
    };

    const switchTheme = (newTheme) => {
        setTheme(newTheme);
        setIsDarkMode(newTheme === 'pixel-dark' || newTheme === 'clean-dark');
        localStorage.setItem('taskTowerTheme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleDarkMode, switchTheme }}>
            <div className={`app ${theme}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
