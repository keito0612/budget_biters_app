import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotifacationPermissionBanner = () => {
    return (
        <View style={styles.permissionBanner}>
            <View style={styles.permissionIconContainer}>
                <Ionicons name="notifications-off" size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.permissionTitle}>
                通知が無効になっています
            </Text>
            <Text style={styles.permissionDescription}>
                通知機能を利用するには、通知機能をONにしてください。
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    permissionBanner: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 2,
        borderColor: '#FFE5E5',
    },
    permissionIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFE5E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    permissionDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default NotifacationPermissionBanner;