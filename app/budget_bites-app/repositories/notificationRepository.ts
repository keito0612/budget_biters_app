import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 通知の表示方法を設定
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationData {
    title: string;
    body: string;
    data?: Record<string, any>;
}

export interface ScheduleData {
    hour: number;
    minute: number;
    repeats: boolean;
    type?: 'calendar';
}

export interface NotificationRepository {
    initializeNotification: () => Promise<void>;
    requestPermissions: () => Promise<boolean>;
    setupNotificationChannel: () => Promise<void>;
    scheduleNotification: (
        notification: NotificationData,
        schedule: ScheduleData
    ) => Promise<string | null>;
    cancelNotification: (identifier: string) => Promise<void>;
    cancelAllNotifications: () => Promise<void>;
    checkPermissionStatus(): Promise<boolean>;
    sendImmediateNotification: (notification: NotificationData) => Promise<void>;
    getScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
}

export class NotificationRepositoryImpl implements NotificationRepository {
    /**
     * 通知権限をリクエスト
     */


    async initializeNotification(): Promise<void> {

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        await this.requestPermissions();
    }
    async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return false;
        }

        return true;
    }

    /**
     * Android用の通知チャンネルを設定
     */
    async setupNotificationChannel(): Promise<void> {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('meal-notifications', {
                name: '献立通知',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
    }

    /**
     * 通知をスケジュール
     */
    async scheduleNotification(
        notification: NotificationData,
        schedule: ScheduleData
    ): Promise<string | null> {
        try {
            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.title,
                    body: notification.body,
                    data: notification.data || {},
                    sound: true,
                },
                trigger: {
                    channelId: 'meal-notifications',
                    hour: schedule.hour,
                    minute: schedule.minute,
                    repeats: schedule.repeats,
                } as Notifications.ChannelAwareTriggerInput
            });

            console.log(`Scheduled notification: ${identifier}`);
            return identifier;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    }

    /**
     * 特定の通知をキャンセル
     */
    async cancelNotification(identifier: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(identifier);
    }

    /**
     * すべての通知をキャンセル
     */
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    /**
     * 即座に通知を送信
     */
    async sendImmediateNotification(notification: NotificationData): Promise<void> {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                sound: true,
            },
            trigger: null,
        });
    }

    async checkPermissionStatus(): Promise<boolean> {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    }

    /**
     * スケジュール済みの通知を取得
     */
    async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        return await Notifications.getAllScheduledNotificationsAsync();
    }
}