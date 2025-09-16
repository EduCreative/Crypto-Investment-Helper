import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { PriceAlert } from '../types.ts';

interface AlertsContextType {
  alerts: PriceAlert[];
  addAlert: (alertData: Omit<PriceAlert, 'id' | 'status' | 'createdAt'>) => void;
  removeAlert: (alertId: string) => void;
  updateAlertStatus: (alertId: string, status: 'active' | 'triggered') => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

const ALERTS_STORAGE_KEY = 'cryptoAlerts';

export const AlertsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const savedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
      return savedAlerts ? JSON.parse(savedAlerts) : [];
    } catch (error) {
      console.error("Could not parse alerts from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  const addAlert = useCallback((alertData: Omit<PriceAlert, 'id' | 'status' | 'createdAt'>) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `alert_${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const updateAlertStatus = useCallback((alertId: string, status: 'active' | 'triggered') => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
  }, []);

  return (
    <AlertsContext.Provider value={{ alerts, addAlert, removeAlert, updateAlertStatus }}>
      {children}
    </AlertsContext.Provider>
  );
};

export const useAlerts = (): AlertsContextType => {
  const context = useContext(AlertsContext);
  if (context === undefined) {
    throw new Error('useAlerts must be used within an AlertsProvider');
  }
  return context;
};