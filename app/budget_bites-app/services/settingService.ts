import { SettingRepository } from "../repositories/settingRepository";

export class SettingService {
    private settingRepo: SettingRepository;
    constructor(settingRepo: SettingRepository) {
        this.settingRepo = settingRepo;
    }
    async allDelete() {
        await this.settingRepo.allDeleteData();
    }
}