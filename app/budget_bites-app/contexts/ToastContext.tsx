import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');
    const [visible, setVisible] = useState(false);
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback((msg: string, toastType: ToastType = 'info') => {
        // 既存のタイマーをクリア
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setMessage(msg);
        setType(toastType);
        setVisible(true);

        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            setMessage('');
        });
    }, [opacity]);

    const getBackgroundColor = () => {
        switch (type) {
            case 'success':
                return 'rgba(52, 199, 89, 0.9)';
            case 'error':
                return 'rgba(255, 59, 48, 0.9)';
            case 'warning':
                return 'rgba(255, 149, 0, 0.9)';
            default:
                return 'rgba(0, 0, 0, 0.8)';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && (
                <Animated.View
                    style={[
                        styles.toast,
                        { opacity, backgroundColor: getBackgroundColor() }
                    ]}
                    pointerEvents="none"
                >
                    <Text style={styles.toastText}>{message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        zIndex: 9999,
    },
    toastText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});
