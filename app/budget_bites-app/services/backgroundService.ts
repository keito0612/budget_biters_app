import { HeadlessEvent } from 'react-native-background-fetch';
import { BackgroundRepository } from './../repositories/backgroundRepository';
export class BackgroundService {
    constructor(private backgroundRepo: BackgroundRepository) { }

    async initBackgroundFetch(backgroundTask: () => Promise<void>) {
        await this.backgroundRepo.initBackgroundFetch(backgroundTask);
    }

    async updateHeadlessTask(event: HeadlessEvent, backgroundTask: () => Promise<void>) {
        await this.backgroundRepo.updateHeadlessTask(event, backgroundTask);
    }
}