import { StyleSheet } from 'react-native';

export default StyleSheet.create({
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
    closeText: {
        marginTop: 20,
        textAlign: 'center',
        color: '#888',
    },
});
