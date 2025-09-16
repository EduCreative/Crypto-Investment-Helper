import React, { useState, useEffect, useMemo } from 'react';
import { getLatestNews } from '../services/mockApi';
import type { Coin, NewsArticle, FearAndGreed } from '../types';
import { CoinCard } from './CoinCard';
import { NewsCard } from './NewsCard';
import { FearGreedIndex } from './FearGreedIndex';
import { useDApp } from '../context/DAppContext';
import { useFavorites } from '../context/FavoritesContext';

const AISummary: React.FC = () => {
  const { dailySummary } = useDApp();

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
      <h2 className="text-lg font-semibold text-primary mb-2">
        <i className="fas fa-brain mr-2"></i>AI Daily Summary
      </h2>
      <p className="text-gray-600 dark:text-gray-300">{dailySummary ?? "Generating AI summary..."}</p>
    </div>
  );
};

interface DashboardProps {
  onCoinSelect: (coin: Coin) => void;
}

const NEWS_REFRESH_INTERVAL = 60000; // 60 seconds

export const Dashboard: React.FC<DashboardProps> = ({ onCoinSelect }) => {
  const { coins, loading: coinsLoading, error: coinsError, fearAndGreed } = useDApp();
  const { favoriteCoinIds } = useFavorites();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const favoriteCoins = useMemo(() => {
    const favMap = new Map(favoriteCoinIds.map(id => [id, true]));
    return coins.filter(coin => favMap.has(coin.id));
  }, [coins, favoriteCoinIds]);
  
  const filteredCoins = useMemo(() => {
      if (!searchTerm) {
          return coins.slice(0, 8); // Show top 8 by default
      }
      return coins.filter(coin => 
          coin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [coins, searchTerm]);

  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        setNewsError(null);
        const newsData = await getLatestNews();
        setNews(newsData);
      } catch (error) {
        console.error("Failed to fetch dashboard news:", error);
        setNewsError("Could not load latest news.");
      }
    };
    
    fetchNewsData(); // Initial fetch
    const intervalId = setInterval(fetchNewsData, NEWS_REFRESH_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <AISummary />
      
      {/* Favorites Section */}
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-secondary">
              <i className="fas fa-star mr-2"></i>My Favorites
          </h2>
          {favoriteCoins.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {favoriteCoins.map(coin => <CoinCard key={coin.id} coin={coin} onClick={() => onCoinSelect(coin)} />)}
              </div>
          ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p>You haven't added any favorites yet.</p>
                  <p>Click the <i className="far fa-star text-yellow-400"></i> on any coin to add it here!</p>
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Market Overview</h2>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                    <input 
                        type="text"
                        placeholder="Search coins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 pl-8 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {coinsLoading && searchTerm === '' ? (
                <p>Loading market data...</p>
              ) : coinsError ? (
                <p className="text-danger">{coinsError}</p>
              ) : filteredCoins.length > 0 ? (
                filteredCoins.map(coin => <CoinCard key={coin.id} coin={coin} onClick={() => onCoinSelect(coin)} />)
              ) : (
                 <div className="md:col-span-2 xl:col-span-4 text-center py-4 text-gray-500 dark:text-gray-400">
                    <p>No coins found for "{searchTerm}".</p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Latest News</h2>
            <div className="space-y-4">
              {newsError ? <p className="text-danger">{newsError}</p> : news.map(article => <NewsCard key={article.id} article={article} />)}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Market Sentiment</h2>
           {coinsError && !fearAndGreed ? (
            <p className="text-danger">Could not load market sentiment.</p>
          ) : fearAndGreed ? (
            <FearGreedIndex value={fearAndGreed.value} classification={fearAndGreed.value_classification} />
          ) : (
            <p>Loading sentiment...</p>
          )}
        </div>
      </div>
    </div>
  );
};