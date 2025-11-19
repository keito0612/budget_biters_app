import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePremium } from '../../hooks/usePremium';
import { useAuth } from '../../hooks/useAuth';
import { PremiumBadge } from '../../components/PremiumBadge';
import { ServiceFactory } from '../../factories/serviceFactory';
import { AlertDialog } from '../../components/AlertDialog';
import { AlertType } from '../../types/types';


export default function ProfileScreen() {
    const router = useRouter();
    const { isPremium } = usePremium();
    const { isLoggedIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<AlertType>('success');
    const [alertOnPress, setAlertOnPress] = useState<() => Promise<void> | void>(() => { });
    const settingServise = ServiceFactory.createSettingService();

    const allDeleteClick = () => {
        setShowAlert(true);
        setAlertTitle('全てのデータを削除しますか?');
        setAlertMessage('※削除したデータは復元できません。\n(設定類のデータは削除されません。)');
        setAlertType('warning');
        setAlertOnPress(() => handleAllDelete);
    }

    const handleAllDelete = async () => {
        setShowAlert(false);
        setLoading(true);
        try {
            await settingServise.allDelete();
            Alert.alert('全てのデータを削除しました。');
        } catch (error: any) {
            Alert.alert('エラー', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
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

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>その他</Text>
                    <TouchableOpacity style={styles.item} onPress={allDeleteClick}>
                        <Text style={styles.allDeleteText}>
                            全てのデータを削除
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <AlertDialog title={alertTitle} message={alertMessage} visible={showAlert} alertType={alertType} cancelClick={() => {
                setShowAlert(false);
            }} onPress={alertOnPress} />
        </>
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
    allDeleteText: {
        fontSize: 16,
        color: '#fa0707'
    }
});