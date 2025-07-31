import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Papa from 'papaparse';
import { getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {SafeAreaView} from "react-native-safe-area-context";

const csvUrl =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXOGFWmvUFgJOYffY8arFpHltMm7HUcU2kfQx4lTz-ydft6PBFqKq6Oci9SdejhmvoAJppEApG3Lfn/pub?gid=1462335138&single=true&output=csv';

const categoryStyle = {
  Meczet: { emoji: '🕌', color: '#0E76A8' },
  Sklep: { emoji: '🛒', color: '#28A745' },
  Restauracja: { emoji: '🥘', color: '#E67E22' },
  Cmentarz: { emoji: '🪦', color: '#6C757D' },
};

export default function App() {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [favourites, setFavourites] = useState([]);
  const [showFavourites, setShowFavourites] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const FAV_KEY = 'favouritesList';

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    })();

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      complete: (results) => {
        const parsedData = results.data.map((item) => ({
          ...item,
          Latitude: parseFloat(item.Latitude),
          Longitude: parseFloat(item.Longitude),
          Category:
              item.Category &&
              item.Category.trim().charAt(0).toUpperCase() +
              item.Category.trim().slice(1).toLowerCase(),
        }));
        setPlaces(parsedData);
        setFilteredPlaces(parsedData);
      },
    });

    loadFavourites();
  }, []);

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

  const saveFavourites = async (newFavs) => {
    try {
      await AsyncStorage.setItem(FAV_KEY, JSON.stringify(newFavs));
    } catch (e) {
      console.error('Failed to save favourites:', e);
    }
  };

  const toggleFavourite = (name) => {
    const updated = favourites.includes(name)
        ? favourites.filter((n) => n !== name)
        : [...favourites, name];

    setFavourites(updated);
    saveFavourites(updated);
  };

  useEffect(() => {
    let data = showFavourites
        ? places.filter((p) => favourites.includes(p.Name))
        : places;

    if (categoryFilter) {
      data = data.filter((p) => p.Category === categoryFilter);
    }

    if (userLocation) {
      data = data
          .map((p) => {
            const distance = getDistance(
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: p.Latitude, longitude: p.Longitude }
            );
            return { ...p, distance: distance / 1000 };
          })
          .sort((a, b) => a.distance - b.distance);
    }

    setFilteredPlaces(data);
  }, [categoryFilter, places, userLocation, favourites, showFavourites]);

  return (
      <View style={styles.container}>
        {/* 🧭 Top Bar with Tabs */}
        <SafeAreaView style={styles.topBar}>
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuIcon}>
            <Ionicons name="menu" size={28} color="#000" />
          </TouchableOpacity>

          <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScroll}
          >
            {/* "All" tab */}
            <TouchableOpacity
                key="all"
                onPress={() => setCategoryFilter('')}
                style={styles.tabItem}
            >
              <Text
                  style={[
                    styles.tabText,
                    categoryFilter === '' && styles.tabTextActive,
                  ]}
              >
                Wszystkie
              </Text>
            </TouchableOpacity>

            {/* Dynamic category tabs from categoryStyle */}
            {Object.entries(categoryStyle).map(([key, style]) => (
                <TouchableOpacity
                    key={key}
                    onPress={() => setCategoryFilter(key)}
                    style={styles.tabItem}
                >
                  <Text
                      style={[
                        styles.tabText,
                        categoryFilter === key && styles.tabTextActive,
                      ]}
                  >
                    {style.emoji} {key}
                  </Text>
                </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>

        {/* 🗺️ Map */}
        <MapView
            style={styles.map}
            customMapStyle={customMapStyle}
            provider={"google"}
            initialRegion={{
              latitude: 52.237,
              longitude: 21.017,
              latitudeDelta: 3,
              longitudeDelta: 3,
            }}
            showsUserLocation={true}
        >
          {filteredPlaces.map((place, index) => {
            const style = categoryStyle[place.Category] || { emoji: '📍' };
            return (
                <Marker
                    key={index}
                    coordinate={{
                      latitude: place.Latitude,
                      longitude: place.Longitude,
                    }}
                    title={place.Name}
                    pinColor={categoryStyle[place.Category]?.color}
                    onCalloutPress={() => {
                      const url = `https://www.google.com/maps?q=${place.Latitude},${place.Longitude}(${encodeURIComponent(place.Name)})`;
                      Linking.openURL(url);
                    }}
                >
                  <Callout tooltip>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutText}>
                        {`${style.emoji} ${place.Name}`}
                      </Text>
                      <View style={styles.mapButton}>
                        <Text style={style.calloutText}>Go to Maps</Text>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="map" size={24} color="#4285F4" />
                        </View>
                      </View>
                    </View>
                  </Callout>
                </Marker>
            );
          })}
        </MapView>

        {/* 📋 List */}
        <View style={styles.filters}>
          <Text style={styles.label}>
            {showFavourites ? 'Ulubione miejsca:' : 'Lista miejsc:'}
          </Text>

          <FlatList
              data={filteredPlaces}
              keyExtractor={(item, index) => `${item.Name}-${index}`}
              renderItem={({ item }) => {
                const style = categoryStyle[item.Category] || {};
                const distanceStr =
                    item.distance !== undefined
                        ? ` (${item.distance.toFixed(1)} km)`
                        : '';
                const isFav = favourites.includes(item.Name);

                return (
                    <View style={styles.listItem}>
                      <View style={styles.textContainer}>
                        <Text
                            style={styles.placeName}
                            onPress={() => {
                              const url = `https://www.google.com/maps?q=${item.Latitude},${item.Longitude}(${encodeURIComponent(item.Name)})`;
                              Linking.openURL(url);
                            }}
                        >
                          {style.emoji} {item.Name}
                        </Text>
                        <Text style={{ color: '#666' }}>
                          {item.Category}
                          {distanceStr}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => toggleFavourite(item.Name)}>
                        <Text style={{ fontSize: 20 }}>{isFav ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    </View>
                );
              }}
          />
        </View>

        {/* 📱 Modal Menu */}
        <Modal
            visible={menuVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowFavourites(false);
                    setMenuVisible(false);
                  }}
              >
                <Text style={styles.menuText}>📍 Wszystkie miejsca</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowFavourites(true);
                    setMenuVisible(false);
                  }}
              >
                <Text style={styles.menuText}>⭐ Ulubione miejsca</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <Text style={styles.suggestionText}>
                Znasz miejsce, którego tu nie ma?
              </Text>
              <TouchableOpacity
                  style={styles.suggestionButton}
                  onPress={() =>
                      Linking.openURL('https://forms.gle/dL256gxLXWHzCpT7A')
                  }
              >
                <Text style={styles.suggestionButtonText}>Zaproponuj miejsce</Text>
              </TouchableOpacity>
              <Pressable onPress={() => setMenuVisible(false)}>
                <Text style={{ marginTop: 20, textAlign: 'center', color: '#888' }}>
                  Zamknij
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
  );
}

// Custom map style
const customMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#ebe3cd' }]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#523735' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f1e6' }]
  },
  {
    featureType: 'administrative',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#c9b2a6' }]
  },
  {
    featureType: 'landscape.natural',
    elementType: 'geometry',
    stylers: [{ color: '#dfd2ae' }]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#dfd2ae' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry.fill',
    stylers: [{ color: '#a5b076' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#f5f1e6' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#fdfcf8' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#f8c967' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#b9d3c2' }]
  }
];

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8deca',
    paddingTop: 40,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  menuIcon: {
    paddingRight: 10,
  },
  tabScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    marginRight: 15,
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
  map: {
    width: Dimensions.get('window').width,
    height: '50%',
  },
  filters: {
    padding: 10,
    backgroundColor: '#fff',
    height: '50%',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  listItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  placeName: {
    fontSize: 16,
    flexWrap: 'wrap',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000055',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 15,
  },
  suggestionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  suggestionButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  suggestionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calloutContainer: {
    width: 180,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
  },
  calloutText: {
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  mapButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
});
