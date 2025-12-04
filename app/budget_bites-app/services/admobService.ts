import { AdmodRepositoryImpl } from './../repositories/admobRepository';

export class AdmobService {
    private admobRepo: AdmodRepositoryImpl;
    constructor(admobRepo: AdmodRepositoryImpl) {
        this.admobRepo = admobRepo;
    }

    async initializeAds() {
        await this.admobRepo.initializeAds();
    }
}