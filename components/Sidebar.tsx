import React from 'react';
import type { Page } from '../types.ts';
import { ThemeToggle } from './ThemeToggle.tsx';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  iconClass: string;
  label: Page;
  isActive: boolean;
  onClick: () => void;
}> = ({ iconClass, label, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`flex items-center justify-center md:justify-start w-full p-3 my-2 text-gray-500 dark:text-gray-400 rounded-lg transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white ${isActive ? 'bg-primary text-white' : ''}`}
    >
      <i className={`fas ${iconClass} w-6 text-center text-lg`}></i>
      <span className="hidden md:inline md:ml-4 font-medium">{label}</span>
    </button>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const navItems: { label: Page; icon: string }[] = [
    { label: 'Dashboard', icon: 'fa-chart-pie' },
    { label: 'Portfolio', icon: 'fa-wallet' },
    { label: 'Recommendations', icon: 'fa-lightbulb' },
    { label: 'Alerts', icon: 'fa-bell' },
    { label: 'Compare', icon: 'fa-scale-balanced' },
    { label: 'Learning Center', icon: 'fa-book-open' },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-16 md:w-64 bg-gray-100 dark:bg-gray-800 p-2 md:p-4 shadow-lg z-10 transition-all duration-300 flex flex-col">
      <div>
        <div className="flex items-center justify-center md:justify-start mb-10">
            <i className="fas fa-rocket text-primary text-3xl"></i>
            <h1 className="hidden md:inline text-xl font-bold ml-2 text-gray-900 dark:text-white">Crypto Helper</h1>
        </div>
        <nav>
            <ul>
            {navItems.map((item) => (
                <NavItem
                key={item.label}
                iconClass={item.icon}
                label={item.label}
                isActive={activePage === item.label}
                onClick={() => setActivePage(item.label)}
                />
            ))}
            </ul>
        </nav>
      </div>
      <div className="mt-auto">
        <ThemeToggle />
      </div>
    </aside>
  );
};