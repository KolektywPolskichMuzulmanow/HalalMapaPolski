import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAV_KEY = 'favouritesList';

export default function useFavourites() {
    const [favourites, setFavourites] = useState([]);

    useEffect(() => {
        const loadFavourites = async () => {
            try {
                const stored = await AsyncStorage.getItem(FAV_KEY);
                if (stored) {
                    setFavourites(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to load favourites:', e);
            }
        };

        loadFavourites();
    }, []);

    const toggleFavourite = async (name) => {
        const updated = favourites.includes(name)
            ? favourites.filter((n) => n !== name)
            : [...favourites, name];

        setFavourites(updated);
        try {
            await AsyncStorage.setItem(FAV_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save favourites:', e);
        }
    };

    return { favourites, toggleFavourite };
}
