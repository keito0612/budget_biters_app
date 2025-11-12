import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePremium } from '../hooks/usePremium';
import { Config } from '../constants/config';


export default function SubscriptionScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();

    if (isPremium) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Premium会員</Text>
                </View>
                <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>👑 Premium会員登録済み</Text>
                </View>
                <Text style={styles.message}>すべての機能をお楽しみいただけます！</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Premiumプラン</Text>
            </View>

            <View style={styles.priceCard}>
                <Text style={styles.price}>¥{Config.premium.monthlyPrice.toLocaleString()}</Text>
                <Text style={styles.period}>/ 月</Text>
            </View>

            <View style={styles.features}>
                <Text style={styles.featuresTitle}>Premium特典</Text>
                {Config.premium.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                        <Text style={styles.featureIcon}>✓</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={styles.purchaseButton} onPress={() => router.push('/login')}>
                <Text style={styles.purchaseText}>Premiumに登録する</Text>
            </TouchableOpacity>
        </ScrollView>
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
    priceCard: {
        backgroundColor: '#FFD700',
        margin: 16,
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
    },
    price: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#000',
    },
    period: {
        fontSize: 18,
        color: '#333',
    },
    features: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        fontSize: 20,
        color: '#007AFF',
        marginRight: 12,
    },
    featureText: {
        fontSize: 16,
        flex: 1,
    },
    purchaseButton: {
        margin: 16,
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
    },
    purchaseText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    premiumBadge: {
        backgroundColor: '#FFD700',
        margin: 16,
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    premiumText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    message: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
});

