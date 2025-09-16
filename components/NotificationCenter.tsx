import React, { useEffect } from 'react';
import { useNotifications } from '../context/NotificationsContext.tsx';
import type { Notification } from '../types.ts';

const NOTIFICATION_TIMEOUT = 7000; // 7 seconds

const getNotificationDetails = (type: 'alert' | 'info' | 'error') => {
    switch (type) {
        case 'alert':
            return { icon: 'fa-bell', color: 'bg-secondary', title: 'Price Alert Triggered!' };
        case 'info':
            return { icon: 'fa-info-circle', color: 'bg-primary', title: 'Order Update' };
        case 'error':
        default:
            return { icon: 'fa-exclamation-circle', color: 'bg-danger', title: 'Error' };
    }
};

const NotificationToast: React.FC<{ notification: Notification; onRemove: (id: string) => void; }> = ({ notification, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(notification.id);
    }, NOTIFICATION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [notification.id, onRemove]);

  const { icon, color, title } = getNotificationDetails(notification.type);
  const borderColor = notification.type === 'alert' ? 'border-secondary' : 'border-primary';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 w-80 animate-fade-in-right border-l-4 ${borderColor}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${color}`}>
            <i className={`fas ${icon} text-white`}></i>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
        </div>
        <button onClick={() => onRemove(notification.id)} className="ml-2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
      </div>
    </div>
  );
};


export const NotificationCenter: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-5 right-5 z-50 space-y-3">
      {notifications.map(notification => (
        <NotificationToast key={notification.id} notification={notification} onRemove={removeNotification} />
      ))}
    </div>
  );
};

// Simple animation for the toast
const styles = document.createElement('style');
styles.innerHTML = `
  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  .animate-fade-in-right {
    animation: fadeInRight 0.5s ease-out forwards;
  }
`;
document.head.appendChild(styles);