import React, { useState } from 'react';
import type { Coin } from '../types.js';
import { useFavorites } from '../context/FavoritesContext.js';

interface CoinCardProps {
  coin: Coin;
  onClick?: () => void;
}

export const CoinCard: React.FC<CoinCardProps> = ({ coin, onClick }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const isPositive = coin.price_change_percentage_24h >= 0;
  const isFav = isFavorite(coin.id);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the main card onClick from firing
    if (isAnimating) return;

    if (!isFav) { // Only animate when adding to favorites
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }
    
    if (isFav) {
      removeFavorite(coin.id);
    } else {
      addFavorite(coin.id);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 w-full text-left disabled:cursor-not-allowed relative border-2 ${isFav ? 'border-yellow-400' : 'border-transparent'}`}
      aria-label={`View details for ${coin.name}`}
    >
      <button
        onClick={handleFavoriteToggle}
        className={`absolute top-2 right-2 text-xl z-10 p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-500/50 transition-colors ${isFav ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}
        aria-label={isFav ? `Remove ${coin.name} from favorites` : `Add ${coin.name} to favorites`}
      >
        <i className={`${isFav ? 'fas' : 'far'} fa-star ${isAnimating ? 'animate-favorite-pop' : ''}`}></i>
      </button>

      <div className="flex items-center mb-2">
        <img src={coin.image} alt={coin.name} className="w-8 h-8 mr-3" />
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{coin.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{coin.symbol.toUpperCase()}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">
          ${coin.current_price.toLocaleString()}
        </p>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold text-white ${isPositive ? 'bg-success' : 'bg-danger'}`}>
          {isPositive ? '▲' : '▼'} {coin.price_change_percentage_24h.toFixed(2)}%
        </span>
      </div>
    </button>
  );
};