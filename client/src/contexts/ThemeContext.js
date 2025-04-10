import React, { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Theme states
    const [theme, setTheme] = useState('light');
    const [variant, setVariant] = useState('clean');

    // Theme toggle
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Variant toggle
    const toggleVariant = () => {
        const newVariant = variant === 'clean' ? 'pixel' : 'clean';
        setVariant(newVariant);
        localStorage.setItem('variant', newVariant);
    };

    // Load saved theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedVariant = localStorage.getItem('variant') || 'clean';
        setTheme(savedTheme);
        setVariant(savedVariant);
    }, []);

    // Update CSS variables based on theme and variant
    useEffect(() => {
        const root = document.documentElement;

        // Base colors
        const baseColors = {
            light: {
                background: '#f8f9fa',
                text: '#2c3e50',
                primary: '#6c5ce7',
                secondary: '#a394f5',
                accent: '#4CAF50',
                border: '#dee2e6',
                cardBackground: '#ffffff',
                inputBackground: '#f8f9fa'
            },
            dark: {
                background: '#1a1a1a',
                text: '#e0e0e0',
                primary: '#7c67ff',
                secondary: '#8f80ff',
                accent: '#4CAF50',
                border: '#333',
                cardBackground: '#2d2d2d',
                inputBackground: '#333'
            }
        };

        // Variant styles
        const variantStyles = {
            clean: {
                fontFamily: 'Arial, sans-serif',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            },
            pixel: {
                fontFamily: 'Press Start 2P, monospace',
                borderRadius: '0',
                boxShadow: 'none'
            }
        };

        // Apply base colors
        const colors = baseColors[theme];
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });

        // Apply variant styles
        const styles = variantStyles[variant];
        Object.entries(styles).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });

        // Apply variant-specific colors
        if (variant === 'pixel') {
            root.style.setProperty('--border', '#fff');
        }
    }, [theme, variant]);

    return (
        <ThemeContext.Provider value={{
            theme,
            variant,
            toggleTheme,
            toggleVariant,
            setTheme,
            setVariant
        }}>
            <div className={`app ${theme} ${variant}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
