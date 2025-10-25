import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './screens/HomeScreen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';

export default function App() {
    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    async function registerForPushNotificationsAsync() {
        if (!Device.isDevice) {
            Alert.alert('Must use physical device for push notifications');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Permission not granted');
            return;
        }

        try {
            const token = await Notifications.getDevicePushTokenAsync();
            console.log('📱 FCM Token:', token.data);
            // TODO: Send token.data to your backend
        } catch (err) {
            console.error('Error getting FCM token:', err);
        }
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <HomeScreen />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
