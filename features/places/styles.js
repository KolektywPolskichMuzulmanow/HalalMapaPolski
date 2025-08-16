import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    wrapper: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
        minHeight: '10%',
        maxHeight: '50%'
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
});
