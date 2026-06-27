import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-google-green-light border-google-green dark:bg-google-green/10',
          text: 'text-google-green dark:text-google-green-dark',
          icon: CheckCircle,
        };
      case 'warning':
        return {
          bg: 'bg-google-yellow-light border-google-yellow dark:bg-google-yellow/10',
          text: 'text-google-yellow dark:text-google-yellow-dark',
          icon: AlertTriangle,
        };
      case 'error':
        return {
          bg: 'bg-google-red-light border-google-red dark:bg-google-red/10',
          text: 'text-google-red dark:text-google-red-dark',
          icon: XCircle,
        };
      default:
        return {
          bg: 'bg-white border-google-gray-300 dark:bg-google-surface-dark dark:border-google-gray-800',
          text: 'text-google-gray-800 dark:text-white',
          icon: CheckCircle,
        };
    }
  };

  const styles = getStyle();
  const Icon = styles.icon;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in ${styles.bg}`}
    >
      <Icon className={`h-5 w-5 ${styles.text}`} />
      <span className="text-sm font-semibold text-google-gray-800 dark:text-white">
        {message}
      </span>
      <button
        onClick={onClose}
        className="ml-4 rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/5"
      >
        <X className="h-4 w-4 text-google-gray-500" />
      </button>
    </div>
  );
};
