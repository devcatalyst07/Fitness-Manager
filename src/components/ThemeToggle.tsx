"use client";

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700">
        <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 shadow-md" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 bg-gray-200 dark:bg-gray-700"
      aria-label="Toggle theme"
      aria-pressed={theme === 'dark'}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-gray-900 shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {theme === 'light' ? (
          <Sun size={14} className="text-yellow-500" />
        ) : (
          <Moon size={14} className="text-blue-400" />
        )}
      </span>
    </button>
  );
}