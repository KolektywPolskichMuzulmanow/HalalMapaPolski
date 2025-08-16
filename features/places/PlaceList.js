import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Linking } from 'react-native';
import styles from './styles';
import { categoryStyle } from './categories';

export default function PlaceList({ places, favourites, onToggleFavourite, showFavourites }) {
    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>
                {showFavourites ? 'Ulubione miejsca:' : 'Lista miejsc:'}
            </Text>

            <FlatList
                data={places}
                keyExtractor={(item, index) => `${item.Name}-${index}`}
                renderItem={({ item }) => {
                    const style = categoryStyle[item.Category] || {};
                    const isFav = favourites.includes(item.Name);
                    const distanceStr =
                        item.distance !== undefined
                            ? ` (${item.distance.toFixed(1)} km)`
                            : '';

                    return (
                        <View style={styles.listItem}>
                            <View style={styles.textContainer}>
                                <Text
                                    style={styles.placeName}
                                    onPress={() =>
                                        Linking.openURL(
                                            `https://www.google.com/maps?q=${item.Latitude},${item.Longitude}(${encodeURIComponent(item.Name)})`
                                        )
                                    }
                                >
                                    {`${style.emoji || '📍'} ${item.Name || ''}`}
                                </Text>
                                <Text style={{ color: '#666' }}>
                                    {item.Category}
                                    {distanceStr}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => onToggleFavourite(item.Name)}>
                                <Text style={{ fontSize: 20 }}>{isFav ? '⭐' : '☆'}</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />
        </View>
    );
}
