import React from 'react';
import { useTheme } from '../context/ThemeContext.js';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center md:justify-start w-full p-3 my-2 text-gray-500 dark:text-gray-400 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <>
                    <i className="fas fa-moon w-6 text-center text-lg"></i>
                    <span className="hidden md:inline md:ml-4 font-medium">Dark Mode</span>
                </>
            ) : (
                <>
                    <i className="fas fa-sun w-6 text-center text-lg"></i>
                    <span className="hidden md:inline md:ml-4 font-medium">Light Mode</span>
                </>
            )}
        </button>
    );
};