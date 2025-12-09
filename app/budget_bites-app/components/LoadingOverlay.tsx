// components/LoadingOverlay.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Dimensions } from 'react-native';

interface LoadingOverlayProps {
    title?: string
    message?: string;
    visible: boolean;
}

const { width } = Dimensions.get('window');

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    title = '読み込み中...',
    message,
    visible,
}) => {
    const dots = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

    useEffect(() => {
        if (!visible) return;

        const animations = dots.map((dot, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 150),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            )
        );

        animations.forEach(anim => anim.start());
        return () => animations.forEach(anim => anim.stop());
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.loaderContainer}>
                <View style={styles.dotsContainer}>
                    {dots.map((dot, index) => {
                        const translateY = dot.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -8],
                        });

                        return (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        transform: [{ translateY }],
                                        opacity: dot.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1],
                                        }),
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: '100%',
        backgroundColor: 'rgba(128, 128, 128, 0.4)', // グレーで透過
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderContainer: {
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'white',
        marginHorizontal: 5,
    },
    title: {
        color: 'white',
        fontSize: 22,
        marginTop: 8,
        fontWeight: '500',
        textAlign: 'center',
    },
    message: {
        color: 'white',
        fontSize: 16,
        marginTop: 8,
        fontWeight: '400',
    },
});
