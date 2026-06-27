import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  GraduationCap,
  CreditCard,
  MessageSquare,
  User,
  Users,
  Settings,
  ShieldAlert,
  ClipboardList,
  LogOut,
  FolderOpen,
  Award
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinks = () => {
    switch (user.role) {
      case 'STUDENT':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/classes', label: 'Live Classes', icon: CalendarDays },
          { to: '/assignments', label: 'Assignments', icon: FileSpreadsheet },
          { to: '/quizzes', label: 'Quizzes & MCQ', icon: GraduationCap },
          { to: '/fees', label: 'EMI Payments', icon: CreditCard },
          { to: '/chat', label: 'Doubt Solving', icon: MessageSquare },
          { to: '/profile', label: 'My Profile', icon: User },
        ];
      case 'MENTOR':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/classes', label: 'Schedules', icon: CalendarDays },
          { to: '/attendance', label: 'Attendance', icon: ClipboardList },
          { to: '/assignments', label: 'Evaluations', icon: FileSpreadsheet },
          { to: '/chat', label: 'Student Chats', icon: MessageSquare },
        ];
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/students-mgmt', label: 'Students CRUD', icon: Users },
          { to: '/mentors-mgmt', label: 'Mentors CRUD', icon: User },
          { to: '/fees-mgmt', label: 'Fees & EMIs', icon: CreditCard },
          { to: '/certificates', label: 'Certificates', icon: Award },
          { to: '/reports', label: 'Reports Desk', icon: FolderOpen },
          { to: '/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-google-gray-200 bg-white transition-transform duration-250 ease-in-out dark:border-google-gray-800 dark:bg-google-surface-dark md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-google-gray-200 dark:border-google-gray-800">
          <span className="text-xl font-extrabold tracking-tight text-google-blue dark:text-google-blue-dark">
            Nxt<span className="text-google-gray-800 dark:text-white">Wave</span>
          </span>
          <span className="ml-2 rounded-full bg-google-blue-light px-2 py-0.5 text-xs font-bold text-google-blue dark:bg-google-blue/15 dark:text-google-blue-dark">
            Portal
          </span>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-google-blue-light text-google-blue dark:bg-google-blue/15 dark:text-google-blue-dark'
                      : 'text-google-gray-600 hover:bg-google-gray-100 dark:text-google-gray-400 dark:hover:bg-google-gray-800'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Session Logout */}
        <div className="border-t border-google-gray-200 p-4 dark:border-google-gray-800">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-google-blue text-sm font-bold text-white uppercase">
              {user.name.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-google-gray-800 dark:text-white">
                {user.name}
              </p>
              <p className="truncate text-xs text-google-gray-500 dark:text-google-gray-400">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-google-red hover:bg-google-red-light dark:hover:bg-google-red/15 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
