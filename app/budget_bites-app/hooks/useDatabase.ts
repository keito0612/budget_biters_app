import { useState, useEffect } from 'react';
import { dbConnection } from '../database/databaseConnection';


export function useDatabase() {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        initDatabase();
    }, []);

    const initDatabase = async () => {
        try {
            await dbConnection.connect();
            setInitialized(true);
        } catch (error) {
            console.error('Database初期化エラー:', error);
        }
    };

    return { initialized };
}