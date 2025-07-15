import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Papa from 'papaparse';
import { Picker } from '@react-native-picker/picker';
import { getDistance } from 'geolib';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // Load user location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    })();

    // Fetch CSV
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

    // Load favourites from storage
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
      {/* Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setMenuVisible(true)}
      >
        <Ionicons name="menu" size={28} color="#000" />
      </TouchableOpacity>

      {/* Map */}
      <MapView
        style={styles.map}
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
            <Marker //pin
              key={index}
              coordinate={{
                latitude: place.Latitude,
                longitude: place.Longitude,
              }}
              onPress={() => {
                const url = `https://www.google.com/maps?q=${place.Latitude},${place.Longitude}(${encodeURIComponent(place.Name)})`;
                Linking.openURL(url);
              }}
              title={`${style.emoji} ${place.Name}`}
              pinColor={`${categoryStyle[place.Category]?.color}`}
            />
          );
        })}
      </MapView>

      {/* Filters & List */}
      <ScrollView style={styles.filters}>
        <Text style={styles.label}>Filtruj według kategorii:</Text>
        <Picker
          selectedValue={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value)}
        >
          <Picker.Item label="Wszystkie" value="" />
          {Object.entries(categoryStyle).map(([key, style]) => (
              <Picker.Item
                  key={key}
                  label={`${style.emoji} ${key}`}
                  value={key}
                  backgroundColor={style.color}
              />
          ))}
        </Picker>

        <Text style={styles.label}>
          {showFavourites ? 'Ulubione miejsca:' : 'Lista miejsc:'}
        </Text>
        {filteredPlaces.map((place, index) => {
          const style = categoryStyle[place.Category] || {};
          const distanceStr =
            place.distance !== undefined
              ? ` (${place.distance.toFixed(1)} km)`
              : '';
          const isFav = favourites.includes(place.Name);

          return (
            <View key={index} style={styles.listItem}>
              <View style={styles.textContainer}>
                <Text style={styles.placeName}
                onPress={() => {
                  const url = `https://www.google.com/maps?q=${place.Latitude},${place.Longitude}(${encodeURIComponent(place.Name)})`;
                  Linking.openURL(url);
                }}>
                  {style.emoji} {place.Name}
                </Text>
                <Text style={{ color: '#666' }}>
                  {place.Category}
                  {distanceStr}
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavourite(place.Name)}>
                <Text style={{ fontSize: 20 }}>{isFav ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal Menu */}
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

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    zIndex: 999,
    backgroundColor: '#ffffffcc',
    borderRadius: 8,
    padding: 6,
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
});
