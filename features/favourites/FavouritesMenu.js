import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    Pressable,
    Linking,
} from 'react-native';
import styles from './styles';

export default function FavouritesMenu({
                                           visible,
                                           onClose,
                                           onShowAll,
                                           onShowFavourites,
                                       }) {
    const suggestUrl = 'https://forms.gle/dL256gxLXWHzCpT7A';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.menuTitle}>Menu</Text>

                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                        onShowAll();
                        onClose();
                    }}>
                        <Text style={styles.menuText}>📍 Wszystkie miejsca</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => {
                        onShowFavourites();
                        onClose();
                    }}>
                        <Text style={styles.menuText}>⭐ Ulubione miejsca</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <Text style={styles.suggestionText}>
                        Znasz miejsce, którego tu nie ma?
                    </Text>

                    <TouchableOpacity
                        style={styles.suggestionButton}
                        onPress={() => Linking.openURL(suggestUrl)}
                    >
                        <Text style={styles.suggestionButtonText}>Zaproponuj miejsce</Text>
                    </TouchableOpacity>

                    <Pressable onPress={onClose}>
                        <Text style={styles.closeText}>Zamknij</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
