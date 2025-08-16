// screens/HomeScreen.js

import React, {useState, useEffect, useMemo} from 'react';
import { View, TouchableOpacity, ScrollView, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import MapViewComponent from '../features/map/MapViewComponent';
import PlaceList from '../features/places/PlaceList';
import usePlaces from '../features/places/hooks/usePlaces';
import useFavourites from '../features/favourites/hooks/useFavourites';
import { filterPlaces } from '../features/places/placeUtils';
import { categoryStyle } from '../features/places/categories';
import FavouritesMenu from '../features/favourites/FavouritesMenu';

import styles from './styles';
import BottomSheet, {BottomSheetView} from "@gorhom/bottom-sheet";

export default function HomeScreen() {
    const places = usePlaces();
    const { favourites, toggleFavourite } = useFavourites();

    const [userLocation, setUserLocation] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showFavourites, setShowFavourites] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const snapPoints = useMemo(() => ['10%','25%', '50%'], []);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setUserLocation(location.coords);
            }
        })();
    }, []);

    const filteredPlaces = filterPlaces({
        places,
        favourites,
        showFavourites,
        category: categoryFilter,
        userLocation,
    });
    const insets = useSafeAreaInsets();


    return (
        <View style={{ flex: 1 }}>
            {/* 🔝 Top Bar with Categories */}
            <SafeAreaView style={[styles.topBar, {paddingTop: insets.top}]} edges={['top']}>
                <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuIcon}>
                    <Ionicons name="menu" size={28} color="#000" />
                </TouchableOpacity>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScroll}
                >
                    <TouchableOpacity onPress={() => setCategoryFilter('')} style={styles.tabItem}>
                        <Text style={[styles.tabText, categoryFilter === '' && styles.tabTextActive]}>
                            Wszystkie
                        </Text>
                    </TouchableOpacity>

                    {Object.entries(categoryStyle).map(([key, val]) => (
                        <TouchableOpacity
                            key={key}
                            onPress={() => setCategoryFilter(key)}
                            style={styles.tabItem}
                        >
                            <Text style={[styles.tabText, categoryFilter === key && styles.tabTextActive]}>
                                {val.emoji} {key}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>

            {/* 🗺️ Map */}
            <View style={{ flex: 1 }}>
                {/*// 🗺️ Map fills the screen*/}
                <MapViewComponent
                    places={filteredPlaces}
                    userLocation={userLocation}
                    style={{flex: 1}}
                />
            </View>
            {/* 📋 Bottom Sheet overlays the map */}
                <BottomSheet
                    snapPoints={snapPoints}
                    index={0}
                    maxDynamicContentSize={200}
                    enablePanDownToClose={false}
                    onChange={(index) => console.log('BottomSheet index:', index)}r
                >
                    <BottomSheetView
                        >
                        <PlaceList
                            places={filteredPlaces}
                            favourites={favourites}
                            onToggleFavourite={toggleFavourite}
                            showFavourites={showFavourites}
                        />

                        {/* ⭐ Menu */}
                        <FavouritesMenu
                            visible={menuVisible}
                            onClose={() => setMenuVisible(false)}
                            onShowAll={() => setShowFavourites(false)}
                            onShowFavourites={() => setShowFavourites(true)}
                        />
                    </BottomSheetView>
                </BottomSheet>
        </View>
    );
}
