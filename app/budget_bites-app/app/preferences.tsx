import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PreferencesScreen() {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>設定</Text>
            </View>
            <Text style={styles.message}>設定画面（実装予定）</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    message: {
        padding: 20,
        textAlign: 'center',
        color: '#666',
    },
});
