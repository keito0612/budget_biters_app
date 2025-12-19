import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { ServiceFactory } from '../factories/serviceFactory';
interface NotifaicationPermissionContextType {
    permisstion: boolean;
}

interface NotifaicationPermissionProvider {
    children: ReactNode;
}

export const NotifaicationPermissionContext = createContext<NotifaicationPermissionContextType | undefined>(undefined);

export const NotifaicationPermissionProvider: React.FC<NotifaicationPermissionProvider> = ({ children }) => {
    const [permisstion, setPermisstion] = useState<boolean>(false);
    const notificationService = ServiceFactory.createNotificationService();

    useEffect(() => {
        const checkPermisstion = async () => {
            const status = await notificationService.checkPermissionStatus();
            setPermisstion(status);
        }
        checkPermisstion();
    }, []);

    return (
        <NotifaicationPermissionContext.Provider value={{ permisstion }}>
            {children}
        </NotifaicationPermissionContext.Provider>
    );
}