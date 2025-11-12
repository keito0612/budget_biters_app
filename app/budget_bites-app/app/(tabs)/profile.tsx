import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePremium } from '../../hooks/usePremium';
import { useAuth } from '../../hooks/useAuth';
import { PremiumBadge } from '../../components/PremiumBadge';


export default function ProfileScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const { isLoggedIn } = useAuth();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>プロフィール</Text>
                {isPremium && <PremiumBadge />}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>アカウント</Text>
                {isLoggedIn ? (
                    <TouchableOpacity style={styles.item}>
                        <Text style={styles.itemText}>✅ ログイン済み</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.item} onPress={() => router.push('/login')}>
                        <Text style={styles.itemText}>ログイン →</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Premium</Text>
                <TouchableOpacity style={styles.item} onPress={() => router.push('/subscription')}>
                    <Text style={styles.itemText}>
                        {isPremium ? '👑 Premium会員' : '⭐ Premiumに登録'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    section: {
        marginTop: 16,
        backgroundColor: 'white',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        padding: 16,
        paddingBottom: 8,
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemText: {
        fontSize: 16,
    },
});