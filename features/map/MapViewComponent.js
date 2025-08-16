// features/map/MapViewComponent.js
import React from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { View, Text } from 'react-native';
import { Linking } from 'react-native';
import { categoryStyle } from '../places/categories';
import { getMarkers } from './markers';
import customMapStyle from './mapStyle';
import styles from './styles';

export default function MapViewComponent({ places, userLocation }) {
    const region = {
        latitude: userLocation?.latitude || 52.237,
        longitude: userLocation?.longitude || 21.017,
        latitudeDelta: 3,
        longitudeDelta: 3,
    };

    return (
        <MapView
            style={styles.map}
            customMapStyle={customMapStyle}
            provider="google"
            initialRegion={region}
            showsUserLocation={true}
        >
            {getMarkers(places)}
        </MapView>
    );
}
