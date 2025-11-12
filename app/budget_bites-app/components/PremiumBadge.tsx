import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export function PremiumBadge() {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.text}>👑 Premium</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    badge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    text: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#000',
    },
});