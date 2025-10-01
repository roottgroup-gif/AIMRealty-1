import { useState, useEffect } from 'react';

const FAVORITES_STORAGE_KEY = 'guest_favorites';

export function useLocalFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }, [favorites]);

  const addFavorite = (propertyId: string) => {
    setFavorites(prev => new Set(Array.from(prev).concat(propertyId)));
  };

  const removeFavorite = (propertyId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      newSet.delete(propertyId);
      return newSet;
    });
  };

  const isFavorite = (propertyId: string) => {
    return favorites.has(propertyId);
  };

  const toggleFavorite = (propertyId: string) => {
    if (favorites.has(propertyId)) {
      removeFavorite(propertyId);
    } else {
      addFavorite(propertyId);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
