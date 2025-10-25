import { StyleSheet, Dimensions } from 'react-native';

export default StyleSheet.create({
    map: {
        width: Dimensions.get('window').width,
        flex: 1,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
