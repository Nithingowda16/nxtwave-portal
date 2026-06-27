import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon, Bell, Search, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Overview Dashboard';
    if (path.startsWith('/classes')) return 'Live Classes & Timetable';
    if (path.startsWith('/assignments')) return 'Assignments Desk';
    if (path.startsWith('/quizzes')) return 'Quizzes & leaderboards';
    if (path.startsWith('/fees')) return 'EMI Fees Ledger';
    if (path.startsWith('/chat')) return 'Doubt Chat Room';
    if (path.startsWith('/profile')) return 'Profile Center';
    if (path.startsWith('/students-mgmt')) return 'Student Management';
    if (path.startsWith('/mentors-mgmt')) return 'Mentor Management';
    if (path.startsWith('/fees-mgmt')) return 'Fee Management';
    if (path.startsWith('/certificates')) return 'Completion Certificates';
    if (path.startsWith('/reports')) return 'Reports Desk';
    if (path.startsWith('/audit-logs')) return 'System Security Logs';
    return 'LMS Portal';
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-google-gray-200 bg-white px-6 dark:border-google-gray-800 dark:bg-google-surface-dark">
      {/* Mobile Hamburger & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-google-gray-500 hover:bg-google-gray-100 dark:text-google-gray-400 dark:hover:bg-google-gray-800 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-google-gray-800 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Mock Search (Global Search representation) */}
        <div className="relative hidden max-w-xs md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-google-gray-400" />
          </div>
          <input
            type="search"
            placeholder="Global search..."
            className="w-48 rounded-full border border-google-gray-300 bg-google-gray-50 py-1.5 pl-9 pr-4 text-sm text-google-gray-800 outline-none transition-all focus:w-60 focus:border-google-blue focus:bg-white dark:border-google-gray-700 dark:bg-google-gray-800 dark:text-white dark:focus:border-google-blue-dark"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-google-gray-500 hover:bg-google-gray-100 dark:text-google-gray-400 dark:hover:bg-google-gray-800"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </button>

        {/* Notification Mock Trigger */}
        <button
          className="relative rounded-full p-2 text-google-gray-500 hover:bg-google-gray-100 dark:text-google-gray-400 dark:hover:bg-google-gray-800"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-google-red" />
        </button>

        <div className="h-8 w-[1px] bg-google-gray-200 dark:bg-google-gray-800" />

        {/* Logged User Initials Icon */}
        <div className="flex items-center gap-2">
          {user?.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover border border-google-gray-300 dark:border-google-gray-700"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-google-blue-light text-sm font-semibold text-google-blue uppercase dark:bg-google-blue/20 dark:text-google-blue-dark">
              {user?.name.slice(0, 2)}
            </div>
          )}
          <span className="hidden text-sm font-medium text-google-gray-700 dark:text-google-gray-300 md:block">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  );
};
