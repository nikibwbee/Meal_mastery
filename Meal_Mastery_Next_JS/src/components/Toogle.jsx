'use client'; 

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="m-2 rounded-md bg-gray-200 dark:bg-gray-500 text-gray-800 dark:text-gray-200 w-32 h-10"
    >
      {theme === 'light' ? '🌞 Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}
