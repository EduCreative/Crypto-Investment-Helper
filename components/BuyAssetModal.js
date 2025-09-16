import React, { useState, useEffect, useMemo } from 'react';
import type { Coin } from '../types.js';
import { usePortfolio } from '../context/PortfolioContext.js';
import { useDApp } from '../context/DAppContext.js';

interface BuyAssetModalProps {
  onClose: () => void;
}

export const BuyAssetModal: React.FC<BuyAssetModalProps> = ({ onClose }) => {
  const { portfolio, buyCoin } = usePortfolio();
  const { coins } = useDApp();
  const [selectedCoinId, setSelectedCoinId] = useState<string>('');
  const [inputType, setInputType] = useState<'usdt' | 'coin'>('usdt');
  const [inputValue, setInputValue] = useState('');
  
  const selectedCoin = useMemo(() => {
      return coins.find(c => c.id === selectedCoinId) || null;
  }, [selectedCoinId, coins]);

  // Reset input when coin selection changes
  useEffect(() => {
    setInputValue('');
  }, [selectedCoinId]);

  const { coinAmount, usdtTotal } = useMemo(() => {
    if (!selectedCoin || !inputValue) return { coinAmount: 0, usdtTotal: 0 };
    const numericValue = parseFloat(inputValue);
    if (isNaN(numericValue) || numericValue < 0) return { coinAmount: 0, usdtTotal: 0 };

    if (inputType === 'usdt') {
      return {
        usdtTotal: numericValue,
        coinAmount: numericValue / selectedCoin.current_price,
      };
    } else { // inputType === 'coin'
      return {
        usdtTotal: numericValue * selectedCoin.current_price,
        coinAmount: numericValue,
      };
    }
  }, [inputValue, inputType, selectedCoin]);

  const handleInputTypeChange = (newType: 'usdt' | 'coin') => {
    if (inputType !== newType) {
      setInputValue(''); // Clear input on type switch for clarity
      setInputType(newType);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };
  
  const handleMaxClick = () => {
    if (!selectedCoin) return;
    if (inputType === 'usdt') {
      setInputValue(portfolio.usdtBalance.toFixed(2));
    } else {
      const maxCoin = portfolio.usdtBalance / selectedCoin.current_price;
      // Use parseFloat to remove insignificant trailing zeros
      setInputValue(parseFloat(maxCoin.toFixed(8)).toString());
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoin) {
        alert("Please select a coin.");
        return;
    }
    if (coinAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    const success = buyCoin(selectedCoin, coinAmount, selectedCoin.current_price);

    if (success) {
      onClose();
    }
  };

  const subtext = useMemo(() => {
    if (!inputValue || !selectedCoin) return '';
    if (inputType === 'usdt') {
      return `≈ ${coinAmount.toFixed(6)} ${selectedCoin.symbol.toUpperCase()}`;
    }
    return `≈ $${usdtTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [inputValue, inputType, selectedCoin, coinAmount, usdtTotal]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Buy New Asset</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="coin" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Select Coin</label>
            <select
                id="coin"
                value={selectedCoinId}
                onChange={(e) => setSelectedCoinId(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
                <option value="" disabled>-- Choose a cryptocurrency --</option>
                {coins.map(coin => (
                    <option key={coin.id} value={coin.id}>
                        {coin.name} ({coin.symbol.toUpperCase()})
                    </option>
                ))}
            </select>
          </div>
          
          {selectedCoin && (
            <>
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                    <button type="button" onClick={() => handleInputTypeChange('usdt')} className={`px-3 py-1 text-sm rounded-md transition-colors ${inputType === 'usdt' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                        Buy in USDT
                    </button>
                    <button type="button" onClick={() => handleInputTypeChange('coin')} className={`px-3 py-1 text-sm rounded-md transition-colors ${inputType === 'coin' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                        Buy in {selectedCoin.symbol.toUpperCase()}
                    </button>
                </div>
                <div className="flex justify-between items-baseline text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <label htmlFor="amount" className="font-medium">Amount</label>
                  <span>Balance: {portfolio.usdtBalance.toFixed(2)} USDT</span>
                </div>
                <div className="relative">
                    <input
                      type="text"
                      id="amount"
                      value={inputValue}
                      onChange={handleInputChange}
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                      aria-label={`Amount in ${inputType}`}
                    />
                     <span className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">{inputType.toUpperCase()}</span>
                     <button type="button" onClick={handleMaxClick} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white text-xs px-2 py-1 rounded hover:bg-blue-500 transition-colors">MAX</button>
                </div>
                {subtext && <p className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1 h-5">{subtext}</p>}
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 flex justify-between items-center text-gray-600 dark:text-gray-300 mb-4">
                <span className="flex items-center text-sm">
                  <i className="fas fa-tag mr-2 text-primary"></i>
                  Current Price
                </span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">${selectedCoin.current_price.toLocaleString()}</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>

              <div className="flex justify-between items-center text-xl font-bold mb-6">
                <span className="text-gray-600 dark:text-gray-300">Total</span>
                <span className="font-mono">${usdtTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
              <button
                type="submit"
                className="w-full p-3 rounded-md font-bold text-white transition-colors bg-success hover:bg-green-500"
              >
                Confirm Buy
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};