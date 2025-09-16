import React, { useState, useEffect } from 'react';
import type { Coin } from '../types.ts';
import { usePortfolio } from '../context/PortfolioContext.tsx';

interface TradeModalProps {
  coin: Coin;
  tradeType: 'buy' | 'sell';
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ coin, tradeType, onClose }) => {
  const { portfolio, buyCoin, sellCoin, placeLimitOrder } = usePortfolio();
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [total, setTotal] = useState(0);

  const holding = portfolio.holdings[coin.id];
  const maxAmount = tradeType === 'buy'
    ? portfolio.usdtBalance / coin.current_price
    : (holding ? holding.amount : 0);

  useEffect(() => {
    const numericAmount = parseFloat(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      if (orderType === 'market') {
        setTotal(numericAmount * coin.current_price);
      } else {
        const numericLimitPrice = parseFloat(limitPrice);
        if (!isNaN(numericLimitPrice) && numericLimitPrice > 0) {
          setTotal(numericAmount * numericLimitPrice);
        } else {
          setTotal(0);
        }
      }
    } else {
      setTotal(0);
    }
  }, [amount, limitPrice, orderType, coin.current_price]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) { // Allow only numbers and one dot
      setAmount(value);
    }
  };

  const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setLimitPrice(value);
    }
  };
  
  const handleMaxClick = () => {
    // Convert to string and trim unnecessary trailing zeros for a cleaner UI
    setAmount(parseFloat(maxAmount.toFixed(8)).toString());
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    if (orderType === 'market') {
        let success = false;
        if (tradeType === 'buy') {
          success = buyCoin(coin, numericAmount, coin.current_price);
        } else {
          success = sellCoin(coin, numericAmount, coin.current_price);
        }

        if (success) {
          onClose();
        }
    } else { // Limit order
        const numericLimitPrice = parseFloat(limitPrice);
        if (isNaN(numericLimitPrice) || numericLimitPrice <= 0) {
            alert("Please enter a valid limit price.");
            return;
        }
        const success = placeLimitOrder(tradeType, coin, numericAmount, numericLimitPrice);
        if (success) {
            onClose();
        }
    }
  };

  const OrderTypeButton: React.FC<{ type: 'market' | 'limit', label: string }> = ({ type, label }) => (
      <button
        type="button"
        onClick={() => setOrderType(type)}
        className={`w-full p-2 text-center font-semibold rounded-md transition-colors ${orderType === type ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold capitalize">{tradeType} {coin.name}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <OrderTypeButton type="market" label="Market" />
            <OrderTypeButton type="limit" label="Limit" />
        </div>

        <form onSubmit={handleSubmit}>
          {orderType === 'limit' && (
            <div className="mb-4">
                <label htmlFor="limitPrice" className="block font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">Limit Price (USD)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                        type="text"
                        id="limitPrice"
                        value={limitPrice}
                        onChange={handleLimitPriceChange}
                        className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 pl-6 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                        aria-label="Limit price in USD"
                    />
                </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between items-baseline text-sm text-gray-500 dark:text-gray-400 mb-1">
              <label htmlFor="amount" className="font-medium">Amount ({coin.symbol.toUpperCase()})</label>
              <span>{tradeType === 'buy' ? 'Balance:' : 'Holding:'} {maxAmount.toFixed(4)}</span>
            </div>
            <div className="relative">
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white p-3 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                  aria-label={`Amount in ${coin.symbol.toUpperCase()}`}
                />
                 <button type="button" onClick={handleMaxClick} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white text-xs px-2 py-1 rounded hover:bg-blue-500 transition-colors">MAX</button>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 flex justify-between items-center text-gray-600 dark:text-gray-300 mb-4">
            <span className="flex items-center text-sm">
              <i className="fas fa-tag mr-2 text-primary"></i>
              Market Price
            </span>
            <span className="font-mono font-semibold text-gray-900 dark:text-white">${coin.current_price.toLocaleString()}</span>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>

          <div className="flex justify-between items-center text-xl font-bold mb-6">
            <span className="text-gray-600 dark:text-gray-300">{orderType === 'market' ? 'Total' : 'Est. Total'}</span>
            <span className="font-mono">${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <button
            type="submit"
            className={`w-full p-3 rounded-md font-bold text-white transition-colors ${tradeType === 'buy' ? 'bg-success hover:bg-green-500' : 'bg-danger hover:bg-red-500'}`}
          >
            {orderType === 'market' 
                ? `Confirm Market ${tradeType}` 
                : `Place Limit ${tradeType} Order`
            }
          </button>
        </form>
      </div>
    </div>
  );
};