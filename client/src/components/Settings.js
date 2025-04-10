import React, { useState, useContext } from 'react';
import './Settings.css';
import { useTheme } from '../contexts/ThemeContext';

const Settings = ({ onClose }) => {
  const { theme, variant, toggleVariant, switchTheme } = useTheme();

  const themes = [
    {
      id: 'pixel',
      name: 'Pixel Theme',
      description: 'Retro pixel art style with 2P font',
      preview: '2P Font Preview'
    },
    {
      id: 'clean',
      name: 'Clean Theme',
      description: 'Modern, clean design with readable font',
      preview: 'Clean Font Preview'
    }
  ];

  const variants = [
    {
      id: 'light',
      name: 'Light',
      description: 'Light background with dark text'
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Dark background with light text'
    }
  ];

  const handleThemeChange = (themeId) => {
    switchTheme(themeId);
  };

  const handleVariantChange = () => {
    toggleVariant();
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-section">
          <h3>Theme</h3>
          <div className="theme-options">
            {themes.map((themeOption) => (
              <div
                key={themeOption.id}
                className={`theme-option ${themeOption.id === theme ? 'active' : ''}`}
                onClick={() => handleThemeChange(themeOption.id)}
              >
                <div className="theme-preview">
                  <div className="preview-text">{themeOption.preview}</div>
                </div>
                <div className="theme-info">
                  <h4>{themeOption.name}</h4>
                  <p>{themeOption.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>Variant</h3>
          <div className="variant-options">
            {variants.map((variantOption) => (
              <div
                key={variantOption.id}
                className={`variant-option ${variantOption.id === variant ? 'active' : ''}`}
                onClick={handleVariantChange}
              >
                <div className="variant-info">
                  <h4>{variantOption.name}</h4>
                  <p>{variantOption.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
