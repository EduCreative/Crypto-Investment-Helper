import React, { useState, useMemo } from 'react';
import { useAlerts } from '../context/AlertsContext';
import { useDApp } from '../context/DAppContext';
import { CreateAlertModal } from './CreateAlertModal';
import type { PriceAlert, Coin } from '../types';

const AlertItem: React.FC<{ alert: PriceAlert; coin?: Coin; onRemove: (id: string) => void }> = ({ alert, coin, onRemove }) => {
    const conditionText = alert.condition === 'above' ? 'is above' : 'is below';
    const isTriggered = alert.status === 'triggered';

    return (
        <div className={`bg-white dark:bg-gray-700 p-4 rounded-lg flex items-center justify-between transition-opacity ${isTriggered ? 'opacity-60' : ''}`}>
            <div className="flex items-center space-x-4">
                {coin ? <img src={coin.image} alt={coin.name} className="w-10 h-10" /> : <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full"></div>}
                <div>
                    <h4 className="font-bold text-lg">{coin?.name || alert.coinId}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Notify when price <span className="font-semibold text-primary">{conditionText}</span> ${alert.targetPrice.toLocaleString()}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                {isTriggered && (
                    <span className="text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-success px-3 py-1 rounded-full">
                        <i className="fas fa-check-circle mr-2"></i>Triggered
                    </span>
                )}
                <button
                    onClick={() => onRemove(alert.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-danger transition-colors"
                    aria-label="Delete alert"
                >
                    <i className="fas fa-trash"></i>
                </button>
            </div>
        </div>
    );
};

export const AlertsPage: React.FC = () => {
    const { alerts, removeAlert } = useAlerts();
    const { coins } = useDApp();
    const [isModalOpen, setModalOpen] = useState(false);

    const coinMap = useMemo(() => new Map(coins.map(c => [c.id, c])), [coins]);

    const activeAlerts = alerts.filter(a => a.status === 'active');
    const triggeredAlerts = alerts.filter(a => a.status === 'triggered');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Price Alerts</h1>
                <button onClick={() => setModalOpen(true)} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors">
                    <i className="fas fa-plus mr-2"></i>Create New Alert
                </button>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-secondary">
                    <i className="fas fa-hourglass-half mr-2"></i>Active Alerts ({activeAlerts.length})
                </h2>
                {activeAlerts.length > 0 ? (
                    <div className="space-y-3">
                        {activeAlerts.map(alert => (
                            <AlertItem key={alert.id} alert={alert} coin={coinMap.get(alert.coinId)} onRemove={removeAlert} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-500 text-center py-4">You have no active alerts.</p>
                )}
            </div>

            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-500 dark:text-gray-400">
                    <i className="fas fa-history mr-2"></i>Triggered History ({triggeredAlerts.length})
                </h2>
                {triggeredAlerts.length > 0 ? (
                    <div className="space-y-3">
                        {triggeredAlerts.map(alert => (
                            <AlertItem key={alert.id} alert={alert} coin={coinMap.get(alert.coinId)} onRemove={removeAlert} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-500 text-center py-4">No alerts have been triggered yet.</p>
                )}
            </div>

            {isModalOpen && <CreateAlertModal onClose={() => setModalOpen(false)} />}
        </div>
    );
};