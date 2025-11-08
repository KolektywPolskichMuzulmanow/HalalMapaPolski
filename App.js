import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
  Meczet: { emoji: '🕌' },
  Sklep: { emoji: '🛒' },
  Restauracja: { emoji: '🥘' },
  Cmentarz: { emoji: '🪦' },
};

const DEFAULT_ITEM_HEIGHT = 84;
const LIST_BOTTOM_PADDING = 16;

export default function App() {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [favourites, setFavourites] = useState([]);
  const [showFavourites, setShowFavourites] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const FAV_KEY = 'favouritesList';

  const mapRef = useRef(null);
  const listRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [pinnedPlace, setPinnedPlace] = useState(null);

  const itemHeights = useRef({});
  const [headerHeight, setHeaderHeight] = useState(0);
  const [listHeight, setListHeight] = useState(0);

  const focusMapOn = (lat, lon) => {
    if (!mapRef.current) return;
    if (mapRef.current.animateCamera) {
      mapRef.current.animateCamera(
        { center: { latitude: lat, longitude: lon }, zoom: 14 },
        { duration: 500 }
      );
    } else {
      mapRef.current.animateToRegion(
        { latitude: lat, longitude: lon, latitudeDelta: 0.03, longitudeDelta: 0.03 },
        500
      );
    }
  };

  const centerOnMe = async () => {
    try {
      if (!userLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
        focusMapOn(loc.coords.latitude, loc.coords.longitude);
      } else {
        focusMapOn(userLocation.latitude, userLocation.longitude);
      }
    } catch (e) {
      console.warn('Could not center on user', e);
    }
  };

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
      if (stored) setFavourites(JSON.parse(stored));
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

    if (categoryFilter) data = data.filter((p) => p.Category === categoryFilter);

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

    if (pinnedPlace && !data.some((d) => d.Name === pinnedPlace.Name)) {
      setPinnedPlace(null);
    }
    itemHeights.current = {};
  }, [categoryFilter, places, userLocation, favourites, showFavourites]);

  const ListHeader = () => (
    <View
      style={styles.headerWrap}
      onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}
    >
      <Text style={styles.label}>Filtruj według kategorii:</Text>
      <Picker selectedValue={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
        <Picker.Item label="Wszystkie" value="" />
        <Picker.Item label="Meczet" value="Meczet" />
        <Picker.Item label="Restauracja" value="Restauracja" />
        <Picker.Item label="Sklep" value="Sklep" />
        <Picker.Item label="Cmentarz" value="Cmentarz" />
      </Picker>
      <Text style={styles.label}>{showFavourites ? 'Ulubione miejsca:' : 'Lista miejsc:'}</Text>
    </View>
  );

  const SingleCard = () => {
    if (!pinnedPlace) return null;
    const isFav = favourites.includes(pinnedPlace.Name);
    const emoji = categoryStyle[pinnedPlace.Category]?.emoji ?? '📍';
    const distanceStr =
      pinnedPlace.distance !== undefined ? ` (${pinnedPlace.distance.toFixed(1)} km)` : '';
    return (
      <View style={styles.listContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => setPinnedPlace(null)}>
          <Text style={styles.backButtonText}>← Pokaż wszystkie</Text>
        </TouchableOpacity>
        <View style={[styles.listItem, styles.listItemSelected]}>
          <View style={styles.textContainer}>
            <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">
              {emoji} {pinnedPlace.Name}
            </Text>
            <Text style={{ color: '#666' }} numberOfLines={2} ellipsizeMode="tail">
              {pinnedPlace.Category}
              {distanceStr}
            </Text>
            {pinnedPlace.Address ? (
              <Text style={{ color: '#666' }} numberOfLines={2} ellipsizeMode="tail">
                {pinnedPlace.Address}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => toggleFavourite(pinnedPlace.Name)}>
            <Text style={{ fontSize: 20 }}>{isFav ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Menu button */}
      <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
        <Ionicons name="menu" size={28} color="#000" />
      </TouchableOpacity>

      {/* Custom "My Location" button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={centerOnMe}
        accessibilityLabel="Go to my location"
      >
        <Ionicons name="locate" size={26} color="#000" />
      </TouchableOpacity>

      {/* MapView */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 52.237,
          longitude: 21.017,
          latitudeDelta: 3,
          longitudeDelta: 3,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}  // 👈 Hides default Android location button
      >
        {filteredPlaces.map((place, index) => {
          const style = categoryStyle[place.Category] || { emoji: '📍' };
          return (
            <Marker
              key={index}
              coordinate={{ latitude: place.Latitude, longitude: place.Longitude }}
              title={`${style.emoji} ${place.Name}`}
              onPress={() => {
                setSelectedIndex(index);
                setPinnedPlace(place);
                focusMapOn(place.Latitude, place.Longitude);
              }}
            />
          );
        })}
      </MapView>

      {/* List */}
      <View style={styles.listPane}>
        {pinnedPlace ? (
          <SingleCard />
        ) : (
          <FlatList
            ref={listRef}
            onLayout={({ nativeEvent }) => setListHeight(nativeEvent.layout.height)}
            data={filteredPlaces}
            keyExtractor={(_, i) => String(i)}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: place, index }) => {
              const style = categoryStyle[place.Category] || {};
              const distanceStr =
                place.distance !== undefined ? ` (${place.distance.toFixed(1)} km)` : '';
              const isFav = favourites.includes(place.Name);
              return (
                <TouchableOpacity
                  onLayout={({ nativeEvent }) => {
                    itemHeights.current[index] = nativeEvent.layout.height;
                  }}
                  style={[
                    styles.listItem,
                    selectedIndex === index && styles.listItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedIndex(index);
                    setPinnedPlace(place);
                    focusMapOn(place.Latitude, place.Longitude);
                  }}
                >
                  <View style={styles.textContainer}>
                    <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">
                      {style.emoji} {place.Name}
                    </Text>
                    <Text style={{ color: '#666' }} numberOfLines={1} ellipsizeMode="tail">
                      {place.Category}
                      {distanceStr}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleFavourite(place.Name)}>
                    <Text style={{ fontSize: 20 }}>{isFav ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
            initialNumToRender={16}
            windowSize={10}
            removeClippedSubviews
          />
        )}
      </View>

      {/* Modal menu */}
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
            <View className="divider" style={styles.divider} />
            <Text style={styles.suggestionText}>Znasz miejsce, którego tu nie ma?</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: '50%' },
  listPane: { height: '50%', backgroundColor: '#fff' },
  listContent: { paddingHorizontal: 10, paddingBottom: 16 },
  headerWrap: { paddingTop: 10 },
  label: { fontWeight: 'bold', marginBottom: 5, marginTop: 10 },
  listItemSelected: { backgroundColor: '#eef6ff', borderRadius: 8 },
  listItem: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: { flex: 1, paddingRight: 10 },
  placeName: { fontSize: 16 },
  backButton: {
    marginTop: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  backButtonText: { fontWeight: '600' },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    zIndex: 999,
    backgroundColor: '#ffffffcc',
    borderRadius: 8,
    padding: 6,
  },
  locationButton: {
    position: 'absolute',
    top: 40,
    right: 15,
    zIndex: 999,
    backgroundColor: '#ffffffcc',
    borderRadius: 8,
    padding: 6,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  menuItem: { paddingVertical: 10 },
  menuText: { fontSize: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ddd', marginVertical: 15 },
  suggestionText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 },
  suggestionButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  suggestionButtonText: { color: '#fff', fontWeight: 'bold' },
});
