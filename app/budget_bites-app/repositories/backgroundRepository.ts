
import { dbConnection } from "../database/databaseConnection";
import { Preferences } from "../types/types";
import BackgroundFetch, { HeadlessEvent } from "react-native-background-fetch";
export interface BackgroundRepository {
    initBackgroundFetch(backgroundTask: () => Promise<void>): Promise<void>;
    updateHeadlessTask(event: HeadlessEvent, backgroundTask: () => Promise<void>): Promise<void>;
}


export class BackgroundRepositoryImpl implements BackgroundRepository {
    async initBackgroundFetch(backgroundTask: () => Promise<void>): Promise<void> {
        try {
            const status = await BackgroundFetch.configure(
                {
                    minimumFetchInterval: 1, // 最小間隔（分）
                    enableHeadless: true, // ヘッドレスモードを有効にするか（アプリ終了後も定期実行するか）
                    stopOnTerminate: false, // アプリが終了したときにバックグラウンドフェッチを停止するか
                    startOnBoot: true, // デバイスの起動時にバックグラウンドフェッチを開始するか
                    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // ネットワークが必要か
                },
                // バックグラウンド処理
                async (taskId) => {
                    await backgroundTask();
                    BackgroundFetch.finish(taskId);
                },
                // タイムアウト時の処理
                async (taskId) => {
                    console.warn("[BackgroundFetch] TIMEOUT task: ", taskId);
                    BackgroundFetch.finish(taskId);
                },
            );
            console.log("[BackgroundFetch] configure status: ", status);
        } catch (error) {
            console.error("[BackgroundFetch] Failed to configure: ", error);
        }
    };

    async updateHeadlessTask(event: HeadlessEvent, backgroundTask: () => Promise<void>): Promise<void> {
        let taskId = event.taskId;
        let isTimeout = event.timeout;
        if (isTimeout) {
            BackgroundFetch.finish(taskId);
            return;
        }
        backgroundTask();
        BackgroundFetch.finish(taskId);
    };
}
