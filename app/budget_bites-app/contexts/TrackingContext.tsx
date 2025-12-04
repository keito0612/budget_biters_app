import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AdsConsent, AdsConsentDebugGeography, AdsConsentStatus } from 'react-native-google-mobile-ads';

interface TrackingContextType {
    nonPersonalizedOnly: boolean;
}

export const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

interface TrackingProviderProps {
    children: ReactNode;
}

export const TrackingProvider: React.FC<TrackingProviderProps> = ({ children }) => {
    const [nonPersonalizedOnly, setNonPersonalizedOnly] = useState<boolean>(true);

    useEffect(() => {
        const requestConsent = async () => {
            try {
                const consentInfo = await AdsConsent.requestInfoUpdate({
                    debugGeography: AdsConsentDebugGeography.DISABLED,
                });

                let status = consentInfo.status;

                if (consentInfo.isConsentFormAvailable && status === AdsConsentStatus.REQUIRED) {
                    const result = await AdsConsent.showForm();
                    status = result.status;
                }

                if (status === AdsConsentStatus.OBTAINED) {
                    setNonPersonalizedOnly(false);
                }
            } catch (error) {
                console.warn("Consent error:", error);
            }
        };

        requestConsent();
    }, []);

    return (
        <TrackingContext.Provider value={{ nonPersonalizedOnly }}>
            {children}
        </TrackingContext.Provider>
    );
};
