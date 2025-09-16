import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Notification } from '../types.js';

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'> & { id?: string }) => void;
  removeNotification: (notificationId: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp'> & { id?: string }) => {
    const newNotification: Notification = {
      ...notificationData,
      id: notificationData.id || `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};