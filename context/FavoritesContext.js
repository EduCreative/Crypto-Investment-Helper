import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface FavoritesContextType {
  favoriteCoinIds: string[];
  addFavorite: (coinId: string) => void;
  removeFavorite: (coinId: string) => void;
  isFavorite: (coinId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'cryptoFavorites';

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favoriteCoinIds, setFavoriteCoinIds] = useState<string[]>(() => {
    try {
      const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return savedFavorites ? JSON.parse(savedFavorites) : [];
    } catch (error) {
      console.error("Could not parse favorites from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteCoinIds));
  }, [favoriteCoinIds]);

  const addFavorite = useCallback((coinId: string) => {
    setFavoriteCoinIds(prev => {
      if (!prev.includes(coinId)) {
        return [...prev, coinId];
      }
      return prev;
    });
  }, []);

  const removeFavorite = useCallback((coinId: string) => {
    setFavoriteCoinIds(prev => prev.filter(id => id !== coinId));
  }, []);

  const isFavorite = useCallback((coinId: string) => {
    return favoriteCoinIds.includes(coinId);
  }, [favoriteCoinIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteCoinIds, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};