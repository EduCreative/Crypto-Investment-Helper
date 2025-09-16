import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { getTopCoins, getCoinsByIds } from '../services/coingeckoApi.js';
import { getFearAndGreedIndex } from '../services/externalApis.js';
import { getDailySummary } from '../services/geminiService.js';
import type { Coin, FearAndGreed } from '../types.js';
import { usePortfolio } from './PortfolioContext.js';
import { useFavorites } from './FavoritesContext.js';
import { useAlerts } from './AlertsContext.js';
import { useNotifications } from './NotificationsContext.js';

interface DAppContextType {
  coins: Coin[];
  loading: boolean;
  error: string | null;
  fearAndGreed: FearAndGreed | null;
  dailySummary: string | null;
}

const DAppContext = createContext<DAppContextType | undefined>(undefined);

const DATA_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOP_COINS_TO_FETCH = 20;

export const DAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fearAndGreed, setFearAndGreed] = useState<FearAndGreed | null>(null);
  const [dailySummary, setDailySummary] = useState<string | null>(null);

  const { portfolio, buyCoin, sellCoin, updateLimitOrderStatus } = usePortfolio();
  const { favoriteCoinIds } = useFavorites();
  const { alerts, updateAlertStatus } = useAlerts();
  const { addNotification } = useNotifications();
  
  const uniqueCoinIdsInPortfolio = useMemo(() => Object.keys(portfolio.holdings), [portfolio.holdings]);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
        setLoading(true);
    }
    setError(null);

    try {
      const promises: [Promise<Coin[]>, Promise<FearAndGreed>, ...Promise<string>[]] = [
        getTopCoins(TOP_COINS_TO_FETCH),
        getFearAndGreedIndex(),
      ];

      // Only fetch the AI summary on the very first load to avoid rate limiting.
      if (isInitialLoad) {
        promises.push(getDailySummary());
      }
      
      const [topCoins, fearAndGreedData, summaryData] = await Promise.all(promises);
      
      setFearAndGreed(fearAndGreedData);
      if (summaryData) { // summaryData will only exist on the initial load
        setDailySummary(summaryData);
      }
      
      const topCoinIds = new Set(topCoins.map(c => c.id));
      
      const allPortfolioAndFavoriteIds = [
          ...new Set([...uniqueCoinIdsInPortfolio, ...favoriteCoinIds])
      ];
      
      const additionalIdsToFetch = allPortfolioAndFavoriteIds.filter(id => !topCoinIds.has(id));

      let additionalCoins: Coin[] = [];
      if (additionalIdsToFetch.length > 0) {
          additionalCoins = await getCoinsByIds(additionalIdsToFetch);
      }
      
      const allCoinsMap = new Map<string, Coin>();
      [...topCoins, ...additionalCoins].forEach(coin => {
        allCoinsMap.set(coin.id, coin);
      });
      
      const newCoinList = Array.from(allCoinsMap.values()).sort((a,b) => a.market_cap > b.market_cap ? -1 : 1);
      setCoins(newCoinList);

    } catch (err: any) {
      console.error("Error fetching application data:", err);
      setError(err.message || 'Failed to load crypto data.');
    } finally {
        if (isInitialLoad) {
            setLoading(false);
        }
    }
  }, [uniqueCoinIdsInPortfolio, favoriteCoinIds]);

  useEffect(() => {
    fetchData(true); // Initial load, fetches everything
    const interval = setInterval(() => fetchData(false), DATA_REFRESH_INTERVAL); // Subsequent refreshes, omits AI summary
    return () => clearInterval(interval);
  }, [fetchData]);

  // Effect for checking price alerts
  useEffect(() => {
      if (!coins.length || !alerts.length) return;

      const activeAlerts = alerts.filter(a => a.status === 'active');
      if (!activeAlerts.length) return;

      const coinPriceMap = new Map(coins.map(c => [c.id, c.current_price]));

      activeAlerts.forEach(alert => {
          const currentPrice = coinPriceMap.get(alert.coinId);
          if (currentPrice === undefined) return;

          const shouldTrigger = (alert.condition === 'above' && currentPrice > alert.targetPrice) ||
                                (alert.condition === 'below' && currentPrice < alert.targetPrice);
          
          if (shouldTrigger) {
              const coin = coins.find(c => c.id === alert.coinId);
              addNotification({
                  type: 'alert',
                  message: `${coin?.name || alert.coinId} has gone ${alert.condition} your target of $${alert.targetPrice.toLocaleString()}! Current price: $${currentPrice.toLocaleString()}`
              });
              updateAlertStatus(alert.id, 'triggered');
          }
      });
  }, [coins, alerts, addNotification, updateAlertStatus]);

  // Effect for processing limit orders
  useEffect(() => {
    if (!coins.length || !portfolio.limitOrders.length) return;

    const openOrders = portfolio.limitOrders.filter(o => o.status === 'open');
    if (!openOrders.length) return;

    const coinPriceMap = new Map(coins.map(c => [c.id, c.current_price]));

    openOrders.forEach(order => {
      const currentPrice = coinPriceMap.get(order.coin.id);
      if (currentPrice === undefined) return;

      const { type, coin, amount, limitPrice } = order;
      let shouldFill = false;

      if (type === 'buy' && currentPrice <= limitPrice) {
        shouldFill = true;
      } else if (type === 'sell' && currentPrice >= limitPrice) {
        shouldFill = true;
      }

      if (shouldFill) {
        let success = false;
        if (type === 'buy') {
          success = buyCoin(coin, amount, limitPrice, true);
          if (!success) {
            updateLimitOrderStatus(order.id, 'cancelled');
            addNotification({
              type: 'error',
              message: `Limit buy for ${coin.symbol.toUpperCase()} failed (insufficient funds?) and was cancelled.`
            });
          }
        } else { // sell
          success = sellCoin(coin, amount, limitPrice, true);
           if (!success) {
            updateLimitOrderStatus(order.id, 'cancelled');
            addNotification({
              type: 'error',
              message: `Limit sell for ${coin.symbol.toUpperCase()} failed (insufficient holdings?) and was cancelled.`
            });
          }
        }

        if (success) {
          updateLimitOrderStatus(order.id, 'filled');
          addNotification({
            type: 'info',
            message: `Your limit ${type} order for ${amount.toFixed(4)} ${coin.symbol.toUpperCase()} at $${limitPrice.toLocaleString()} has been filled!`
          });
        }
      }
    });
  }, [coins, portfolio.limitOrders, buyCoin, sellCoin, updateLimitOrderStatus, addNotification]);


  return (
    <DAppContext.Provider value={{ coins, loading, error, fearAndGreed, dailySummary }}>
      {children}
    </DAppContext.Provider>
  );
};

export const useDApp = (): DAppContextType => {
  const context = useContext(DAppContext);
  if (!context) {
    throw new Error('useDApp must be used within a DAppProvider');
  }
  return context;
};