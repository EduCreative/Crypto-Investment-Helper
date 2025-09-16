import React, { useState, useMemo } from 'react';
import { useDApp } from '../context/DAppContext';
import { useAlerts } from '../context/AlertsContext';
import type { Coin } from '../types';

interface CreateAlertModalProps {
  onClose: () => void;
  defaultCoinId?: string;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ onClose, defaultCoinId }) => {
  const { coins } = useDApp();
  const { addAlert } = useAlerts();
  
  const [coinId, setCoinId] = useState(defaultCoinId || '');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');

  const selectedCoin = useMemo(() => coins.find(c => c.id === coinId), [coinId, coins]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (!coinId || isNaN(price) || price <= 0) {
      alert("Please fill out all fields with valid values.");
      return;
    }
    addAlert({ coinId, condition, targetPrice: price });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Price Alert</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="coin" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Cryptocurrency</label>
            <select
              id="coin"
              value={coinId}
              onChange={(e) => setCoinId(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>-- Select a coin --</option>
              {coins.map(coin => (
                <option key={coin.id} value={coin.id}>
                  {coin.name} ({coin.symbol.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          
          {selectedCoin && (
             <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md text-center text-sm">
                Current Price: <span className="font-semibold text-gray-900 dark:text-white">${selectedCoin.current_price.toLocaleString()}</span>
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Condition</label>
            <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCondition('above')} className={`p-3 rounded-md text-center transition-colors ${condition === 'above' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                    <i className="fas fa-arrow-up mr-2"></i>Price is Above
                </button>
                <button type="button" onClick={() => setCondition('below')} className={`p-3 rounded-md text-center transition-colors ${condition === 'below' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                    <i className="fas fa-arrow-down mr-2"></i>Price is Below
                </button>
            </div>
          </div>
          
          <div>
             <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Target Price (USD)</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                <input
                  type="text"
                  id="targetPrice"
                  value={targetPrice}
                  onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && setTargetPrice(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 pl-6 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 70000"
                />
             </div>
          </div>

          <button
            type="submit"
            className="w-full p-3 rounded-md font-bold text-white transition-colors bg-success hover:bg-green-500 disabled:bg-gray-600"
            disabled={!coinId || !targetPrice}
          >
            Create Alert
          </button>
        </form>
      </div>
    </div>
  );
};