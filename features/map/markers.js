import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text } from 'react-native';
import { categoryStyle } from '../places/categories';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './styles';
import * as Linking from 'expo-linking';

export const getMarkers = (places) =>
    places.map((place, index) => {
        const style = categoryStyle[place.Category] || { emoji: '📍' };

        const openGoogleMaps = () => {
            const url = `https://www.google.com/maps?q=${place.Latitude},${place.Longitude}(${encodeURIComponent(
                place.Name
            )})`;
            Linking.openURL(url);
        };

        return (
            <Marker
                key={index}
                coordinate={{
                    latitude: place.Latitude,
                    longitude: place.Longitude,
                }}
                title={place.Name}
                pinColor={categoryStyle[place.Category]?.color}
                onCalloutPress={openGoogleMaps}
            >
                <Callout tooltip>
                    <View style={styles.calloutContainer}>
                        <Text style={styles.calloutText}>
                            {`${style.emoji} ${place.Name}`}
                        </Text>
                        <View style={styles.mapButton}>
                            <Text>Go to Maps</Text>
                            <Icon name="map" size={24} color="#4285F4" />
                        </View>
                    </View>
                </Callout>
            </Marker>
        );
    });
