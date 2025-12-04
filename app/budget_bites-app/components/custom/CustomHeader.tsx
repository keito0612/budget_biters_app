import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
    title?: string;
    showBackButton?: boolean;
    rightButton?: React.ReactNode;
};

export const CustomHeader: React.FC<Props> = ({
    title,
    showBackButton = false,
    rightButton,
}) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56;

    return (
        <View
            style={[
                styles.container,
                { paddingTop: insets.top, height: HEADER_HEIGHT + insets.top },
            ]}
        >
            {/* 左：戻るボタン */}
            {showBackButton ? (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
                        size={24}
                        color="black"
                    />
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}

            {/* タイトル */}
            <Text style={styles.title} numberOfLines={1}>
                {title}
            </Text>

            {/* 右側（設定ボタンなど） */}
            <View style={styles.rightContainer}>{rightButton}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        alignItems: 'flex-start',
    },
    placeholder: {
        width: 40,
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    rightContainer: {
        width: 40,
        alignItems: 'flex-end',
    },
});
