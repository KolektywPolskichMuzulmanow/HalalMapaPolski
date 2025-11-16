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
  ScrollView,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { ReactNativeLegal } from 'react-native-legal';
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
  const [aboutVisible, setAboutVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

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


const AboutMe = () => (
  <View style={styles.sheet}>
    <Text style={styles.menuTitle}>O aplikacji</Text>

    <ScrollView style={{ maxHeight: 360 }}>
      <Text style={{ fontSize: 14, lineHeight: 20 }}>
        
        Halal Mapa Polski — v1.0.0{'\n'}
        Copyright © 2025 Kolektyw Polskich Muzułmanów{'\n\n'}

        Ten program jest wolnym oprogramowaniem: możesz go rozprowadzać dalej i/lub modyfikować
        na warunkach Powszechnej Licencji Publicznej GNU, wydanej przez Free Software Foundation,
        w wersji 3 tej Licencji lub (według twojego wyboru) dowolnej późniejszej wersji.{'\n\n'}

        Ten program jest rozpowszechniany z nadzieją, że będzie użyteczny,
        ale BEZ JAKIEJKOLWIEK GWARANCJI; nawet bez domniemanej gwarancji
        PRZYDATNOŚCI HANDLOWEJ albo PRZYDATNOŚCI DO OKREŚLONEGO CELU.
        Więcej szczegółów znajdziesz w Powszechnej Licencji Publicznej GNU.{'\n\n'}

        Kopia Powszechnej Licencji Publicznej GNU powinna być dołączona do tego programu.
        Jeśli nie, zobacz: &lt;https://www.gnu.org/licenses/&gt;{'\n\n'}
        
        Wszystkie oryginalne projekty wizualne, układy, elementy brandingu, nazwa
        "Halal Mapa Polski" i kompozycje prezentowane w tej aplikacji są objęte prawami
        autorskimi © 2025 Kolektyw Polskich Muzułmanów.{'\n\n'}

        Niektóre materiały wizualne w tej aplikacji zawierają zasoby licencjonowane od
        zewnętrznych dostawców, takich jak Depositphotos. Materiały te zostały
        zmodyfikowane i zintegrowane z oryginalnymi dziełami pochodnymi stworzonymi przez
        Kolektyw Polskich Muzułmanów. Prawa autorskie do oryginalnych materiałów
        stockowych należą do ich odpowiednich właścicieli; prawa autorskie do kompozycji
        pochodnych należą do Kolektyw Polskich Muzułmanów.{'\n\n'}

        Niektóre elementy projektu (takie jak ikony, obrazy i szablony) pochodzą z serwisu
        Canva i są wykorzystywane na podstawie licencji Canva Free Content License i/lub
        licencji Pro Content License, w zależności od przypadku. Elementy te pozostają
        własnością intelektualną ich twórców i licencjodawców.{'\n\n'}

        EN {'\n\n'}
        Halal Mapa Polski — v1.0.0{'\n'}
        Copyright © 2025 Kolektyw Polskich Muzułmanów{'\n\n'}

        This program is free software: you can redistribute it and/or modify
        it under the terms of the GNU General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version.{'\n\n'}

        This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
        MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
        General Public License for more details.{'\n\n'}

        You should have received a copy of the GNU General Public License
        along with this program. If not, see &lt;https://www.gnu.org/licenses/&gt;.{'\n\n'}

        Images, the application name "Halal Mapa Polski", and other branding
        elements are the property of Kolektyw Polskich Muzułmanów.
        They are not covered by the GPL license and may not be reused
        without permission from their rightful owner.{'\n\n'}

        All original visual designs, layouts, branding elements, name "Halal Mapa Polski"
        and compositions presented in this app are © 2025 Kolektyw Polskich Muzułmanów.
        They are not covered by the GPL license and may not be reused without permission
        from their rightful owner.{'\n\n'}

        Some visual materials within this app incorporate assets licensed from third-party
        providers such as Depositphotos. These materials have been modified and integrated
        into original derivative works created by Kolektyw Polskich Muzułmanów. Copyright
        in the original stock materials remains with their respective owners; copyright in
        the derivative compositions belongs to Kolektyw Polskich Muzułmanów.{'\n\n'}

        Certain design elements (such as icons, images, and templates) were sourced from'
        Canva and are used under Canva’s Free Content License and/or Pro Content License,
        as applicable. These elements remain the intellectual property of their respective
        creators and licensors.{'\n\n'}

      </Text>
    </ScrollView>

    {/* Source code link */}
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() =>
        Linking.openURL('https://github.com/KolektywPolskichMuzulmanow/HalalMapaPolski')
      }>
      <Text
        style={[
          styles.menuText,
          { textDecorationLine: 'underline', marginTop: 8 },
        ]}>
        Kod źródłowy aplikacji
      </Text>
    </TouchableOpacity>

    {/* Full GPL text link (external) */}
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => Linking.openURL('https://www.gnu.org/licenses/gpl-3.0.txt')}>
      <Text
        style={[
          styles.menuText,
          { textDecorationLine: 'underline', marginTop: 8 },
        ]}>
        Pełny tekst licencji GPL-3.0
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.menuItem}
      onPress={() =>
        ReactNativeLegal.launchLicenseListScreen('Licencje open-source')
      }>
      <Text
        style={[
          styles.menuText,
          { textDecorationLine: 'underline', marginTop: 8 },
        ]}>
        Pokaż licencje open-source
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        setAboutVisible(false);
        setPrivacyVisible(true);
      }}>
      <Text
        style={[
          styles.menuText,
          { textDecorationLine: 'underline', marginTop: 8 },
        ]}>
        Polityka prywatności
      </Text>
    </TouchableOpacity>

    <Pressable onPress={() => setAboutVisible(false)}>
      <Text
        style={{
          marginTop: 20,
          textAlign: 'center',
          color: '#888',
        }}>
        Zamknij
      </Text>
    </Pressable>
  </View>
);

  const PrivacyPolicy = () => (
    <View style={styles.sheet}>
      <Text style={styles.menuTitle}>Polityka prywatności</Text>
      <ScrollView style={{maxHeight: 360}}>
        <Text style={{fontSize: 14, lineHeight: 20}}>
          Aplikacja nie zbiera, nie przechowuje ani nie przetwarza żadnych danych osobowych użytkowników.{'\n\n'}
          Aplikacja wykorzystuje komponent Google Maps SDK, który może przetwarzać dane, takie jak adres
          IP lub dane o lokalizacji, w celu prawidłowego wyświetlania map.
          Dane te są przetwarzane bezpośrednio przez firmę Google LLC zgodnie z ich Polityką Prywatności:
          &lt;https://policies.google.com/privacy&gt;
        </Text>
      </ScrollView>
      <Pressable onPress={() => setPrivacyVisible(false)}>
        <Text style={{ marginTop: 20, textAlign: 'center', color: '#888' }}>Zamknij</Text>
      </Pressable>
    </View>
  );

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
            <TouchableOpacity
  style={[styles.suggestionButton, { backgroundColor: '#2ecc71', marginTop: 10 }]}
  onPress={() => { setMenuVisible(false); setAboutVisible(true); }}
>
  <Text style={styles.suggestionButtonText}>O aplikacji</Text>
</TouchableOpacity>

<Pressable onPress={() => setMenuVisible(false)}>
              <Text style={{ marginTop: 20, textAlign: 'center', color: '#888' }}>
                Zamknij
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* About modal */}
      <Modal
        visible={aboutVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <AboutMe />
          </View>
        </View>
      </Modal>

      {/* Privacy modal */}
      <Modal
        visible={privacyVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <PrivacyPolicy />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sheet: {
    backgroundColor: '#fff',
  },
});

