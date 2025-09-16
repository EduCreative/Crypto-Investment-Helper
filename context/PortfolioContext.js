import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { PortfolioState, PortfolioContextType, Coin, LimitOrder, Transaction } from '../types.js';

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const INITIAL_BALANCE = 1000;

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => {
    try {
      const savedPortfolio = localStorage.getItem('cryptoPortfolio');
      const parsed = savedPortfolio ? JSON.parse(savedPortfolio) : null;
      return parsed ? {
          ...parsed,
          limitOrders: parsed.limitOrders || [] // Ensure limitOrders exists
      } : {
        usdtBalance: INITIAL_BALANCE,
        holdings: {},
        transactions: [],
        initialBalance: INITIAL_BALANCE,
        limitOrders: []
      };
    } catch (error) {
      console.error("Could not parse portfolio from localStorage", error);
      return {
        usdtBalance: INITIAL_BALANCE,
        holdings: {},
        transactions: [],
        initialBalance: INITIAL_BALANCE,
        limitOrders: []
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  const buyCoin = (coin: Coin, amount: number, price: number, isSilent = false): boolean => {
    const totalCost = amount * price;
    if (portfolio.usdtBalance < totalCost) {
      if (!isSilent) alert("Insufficient funds!");
      return false;
    }

    setPortfolio(prev => {
      const existingHolding = prev.holdings[coin.id];
      const newHoldings = { ...prev.holdings };
      
      if (existingHolding) {
        const totalAmount = existingHolding.amount + amount;
        const totalSpent = (existingHolding.avgBuyPrice * existingHolding.amount) + totalCost;
        newHoldings[coin.id] = {
          ...existingHolding,
          amount: totalAmount,
          avgBuyPrice: totalSpent / totalAmount,
        };
      } else {
        newHoldings[coin.id] = {
          coin,
          amount,
          avgBuyPrice: price,
        };
      }

      const newTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          type: 'buy',
          coin,
          amount,
          price,
          total: totalCost,
          date: new Date().toISOString()
      };

      return {
        ...prev,
        usdtBalance: prev.usdtBalance - totalCost,
        holdings: newHoldings,
        transactions: [newTransaction, ...prev.transactions]
      };
    });
    return true;
  };

  const sellCoin = (coin: Coin, amount: number, price: number, isSilent = false): boolean => {
    const holding = portfolio.holdings[coin.id];
    if (!holding || holding.amount < amount) {
      if (!isSilent) alert("Not enough coins to sell!");
      return false;
    }

    const totalRevenue = amount * price;
    const costBasis = amount * holding.avgBuyPrice;
    const realizedPnl = totalRevenue - costBasis;
    
    setPortfolio(prev => {
      const newHoldings = { ...prev.holdings };
      const existingHolding = newHoldings[coin.id];
      
      if (existingHolding.amount - amount < 0.000001) { // Floating point precision
        delete newHoldings[coin.id];
      } else {
        newHoldings[coin.id] = {
          ...existingHolding,
          amount: existingHolding.amount - amount,
        };
      }

      const newTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          type: 'sell',
          coin,
          amount,
          price,
          total: totalRevenue,
          pnl: realizedPnl,
          date: new Date().toISOString()
      };

      return {
        ...prev,
        usdtBalance: prev.usdtBalance + totalRevenue,
        holdings: newHoldings,
        transactions: [newTransaction, ...prev.transactions]
      };
    });
    return true;
  };

  const placeLimitOrder = (type: 'buy' | 'sell', coin: Coin, amount: number, limitPrice: number, isSilent = false): boolean => {
    if (type === 'buy') {
      const totalCost = amount * limitPrice;
      if (portfolio.usdtBalance < totalCost) {
        if (!isSilent) alert("Insufficient USDT balance to place this limit order.");
        return false;
      }
    } else { // type === 'sell'
      const holding = portfolio.holdings[coin.id];
      if (!holding || holding.amount < amount) {
        if (!isSilent) alert("You do not hold enough of this asset to place this limit sell order.");
        return false;
      }
    }
    
    const newOrder: LimitOrder = {
      id: `limit_${Date.now()}`,
      type,
      coin,
      amount,
      limitPrice,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    
    setPortfolio(prev => ({
      ...prev,
      limitOrders: [newOrder, ...prev.limitOrders],
    }));
    return true;
  };

  const cancelLimitOrder = (orderId: string) => {
    setPortfolio(prev => ({
      ...prev,
      limitOrders: prev.limitOrders.map(order => 
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ),
    }));
  };

  const updateLimitOrderStatus = (orderId: string, status: 'filled' | 'cancelled') => {
    setPortfolio(prev => ({
      ...prev,
      limitOrders: prev.limitOrders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ),
    }));
  };


  return (
    <PortfolioContext.Provider value={{ portfolio, buyCoin, sellCoin, placeLimitOrder, cancelLimitOrder, updateLimitOrderStatus }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};