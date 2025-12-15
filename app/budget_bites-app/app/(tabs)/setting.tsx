import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { usePremium } from '../../hooks/usePremium';
import { useAuth } from '../../hooks/useAuth';
import { PremiumBadge } from '../../components/PremiumBadge';
import { ServiceFactory } from '../../factories/serviceFactory';
import { AlertDialog } from '../../components/AlertDialog';
import { AlertType } from '../../types/types';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/build/MaterialIcons';

export default function SettingScreen() {
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

    const handlePreferencesSetting = async () => {
        router.push("/preferenceSetUp?mode=edit");
    }

    return (
        <>
            <ScrollView style={styles.container}>
                <View style={styles.section}>
                    <Link href={'https://docs.google.com/forms/d/e/1FAIpQLScRJEvNreuWdQaPid9DVduulPojNWohrdmgYRGhnqsCaFk1AQ/viewform?usp=preview'} >
                        <View style={styles.item}>
                            <MaterialCommunityIcons name="email" size={24} color="gray" />
                            <Text style={styles.itemText}>
                                お問い合わせ
                            </Text>
                        </View>
                    </Link>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.item} onPress={handlePreferencesSetting}>
                        <MaterialCommunityIcons name="tune" size={24} color="gray" />
                        <Text style={styles.itemText}>
                            初期設定を編集
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.item} onPress={() => {
                        router.push('mealTime');
                    }}>
                        <MaterialIcons name="notifications" size={24} color="gray" />
                        <Text style={styles.itemText}>
                            献立通知
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.item} onPress={() => {
                        router.push('https://keito0612.github.io/budget_biters_praivacy_poricy/');
                    }}>
                        <MaterialIcons name="privacy-tip" size={24} color="gray" />
                        <Text style={styles.itemText}>
                            プライバシーポリシー・利用規約
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <TouchableOpacity style={styles.item} onPress={allDeleteClick}>
                        <MaterialCommunityIcons name="delete-alert-outline" size={24} color="#fa0707" />
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
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingTop: 16
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
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        padding: 16,
        paddingBottom: 8,
    },
    item: {
        paddingVertical: 24,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemText: {
        fontSize: 18,
    },
    allDeleteText: {
        color: '#fa0707',
        fontSize: 18,
    }
});