; import { NotificationRequest } from "expo-notifications";
import { NotificationData, NotificationRepository, ScheduleData } from "../repositories/notificationRepository";
import { MealTime } from "../types/types";

export class NotificationService {
    constructor(private notificationRepo: NotificationRepository) { }


    async initializeNotification(): Promise<void> {
        await this.notificationRepo.initializeNotification();
    }

    async getScheduledNotifications(): Promise<NotificationRequest[]> {
        return this.notificationRepo.getScheduledNotifications();
    }



    async requestPermissions(): Promise<boolean> {
        return this.notificationRepo.requestPermissions();
    }

    /**
     * Android用の通知チャンネルを設定
     */
    async setupNotificationChannel(): Promise<void> {
        this.notificationRepo.setupNotificationChannel()
    }

    /**
     * 通知をスケジュール
     */
    async scheduleNotification(
        notification: NotificationData,
        schedule: ScheduleData
    ): Promise<string | null> {
        return this.notificationRepo.scheduleNotification(notification, schedule);
    }

    async checkPermissionStatus(): Promise<boolean> {
        const status: boolean = await this.notificationRepo.checkPermissionStatus();
        return status;
    }

    /**
     * 特定の通知をキャンセル
     */
    async cancelNotification(identifier: string): Promise<void> {
        this.notificationRepo.cancelNotification(identifier);
    }

    /**
     * すべての通知をキャンセル
     */
    async cancelAllNotifications(): Promise<void> {
        await this.notificationRepo.cancelAllNotifications();
    }

    /**
     * 即座に通知を送信
     */
    async sendImmediateNotification(notification: NotificationData): Promise<void> {
        this.notificationRepo.sendImmediateNotification(notification);
    }
}

