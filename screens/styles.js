// screens/styles.js

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8deca',
        //paddingTop: 40,
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
    contentContainer: {
        flex: 1,
        padding: 36,
        alignItems: 'center'
    }
});
