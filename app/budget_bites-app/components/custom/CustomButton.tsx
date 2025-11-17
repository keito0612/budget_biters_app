import React from 'react';
import {
    TouchableOpacity,
    Text,
    ActivityIndicator,
    StyleSheet,
    ViewStyle,
    TextStyle,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'elevated' | 'filled' | 'outlined' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface CustomButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    color?: string; // ボタンのテーマカラー
    textColor?: string; // テキストカラーを直接指定
    disabled?: boolean;
    loading?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    iconPosition?: 'left' | 'right';
    borderRadius?: number;
    elevation?: number; // 影の強さ
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
    title,
    onPress,
    variant = 'filled',
    size = 'medium',
    color = '#007AFF',
    textColor,
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    borderRadius = 10,
    elevation = 2,
    style,
    textStyle,
}) => {
    const getBackgroundColor = (): string => {
        if (disabled) return '#D1D1D6';
        switch (variant) {
            case 'filled':
            case 'elevated':
                return color;
            case 'outlined':
            case 'text':
                return 'transparent';
            default:
                return color;
        }
    };

    const getTextColor = (): string => {
        if (textColor) return textColor;
        if (disabled) return '#8E8E93';
        switch (variant) {
            case 'filled':
            case 'elevated':
                return '#fff';
            case 'outlined':
                return color;
            case 'text':
                return color;
            default:
                return '#fff';
        }
    };

    const getButtonHeight = (): number => {
        switch (size) {
            case 'small':
                return 36;
            case 'medium':
                return 44;
            case 'large':
                return 52;
            default:
                return 44;
        }
    };

    const shadowStyle: ViewStyle =
        variant === 'elevated'
            ? {
                shadowColor: '#000',
                shadowOpacity: 0.2,
                shadowOffset: { width: 0, height: elevation },
                shadowRadius: elevation,
                elevation,
            }
            : {};

    const borderStyle: ViewStyle =
        variant === 'outlined'
            ? { borderWidth: 1.5, borderColor: disabled ? '#C7C7CC' : color }
            : {};

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                styles.base,
                {
                    backgroundColor: getBackgroundColor(),
                    height: getButtonHeight(),
                    borderRadius,
                    opacity: disabled ? 0.8 : 1,
                },
                shadowStyle,
                borderStyle,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <View style={styles.content}>
                    {icon && iconPosition === 'left' && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={getTextColor()}
                            style={{ marginRight: 6 }}
                        />
                    )}
                    <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={getTextColor()}
                            style={{ marginLeft: 6 }}
                        />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        fontSize: 16,
    },
});
