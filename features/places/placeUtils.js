import { getDistance } from 'geolib';

export const filterPlaces = ({ places, favourites, showFavourites, category, userLocation }) => {
    let result = [...places];

    if (showFavourites) {
        result = result.filter((p) => favourites.includes(p.Name));
    }

    if (category) {
        result = result.filter((p) => p.Category === category);
    }

    if (userLocation) {
        result = result
            .map((p) => ({
                ...p,
                distance: getDistance(
                    { latitude: userLocation.latitude, longitude: userLocation.longitude },
                    { latitude: p.Latitude, longitude: p.Longitude }
                ) / 1000,
            }))
            .sort((a, b) => a.distance - b.distance);
    }

    return result;
};
