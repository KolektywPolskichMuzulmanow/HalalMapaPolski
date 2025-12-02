export default ({ config }) => ({
  ...config,
  expo: {
    name: "Halal Mapa Polski",
    slug: "snack-fd3f5570-26e1-4efb-bc79-a75cd41b9049",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "pl.kolektywmuzulmanow.halalmapapolski",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_KEY || "YOUR_IOS_MAPS_KEY",
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "We use your location to show halal places near you.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY || "YOUR_ANDROID_MAPS_KEY",
        },
      },
      package: "pl.kolektywmuzulmanow.halalmapapolski",
    },
    plugins: ["expo-font", "expo-location", "react-native-legal"],
    extra: {
      eas: {
        projectId: "99f84690-159d-4487-834d-f4291dfbfa7d",
      },
    },
  },
});
