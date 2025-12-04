import { useState, useEffect } from 'react';
import { dbConnection } from '../database/databaseConnection';

export function useDatabase() {
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initDatabase = async () => {
            try {
                setLoading(true);
                await dbConnection.connect();
                setInitialized(true);
                setError(null);
            } catch (err) {
                console.error('Database初期化エラー:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
                setInitialized(false);
            } finally {
                setLoading(false);
            }
        };

        initDatabase();
    }, []);

    return { initialized, loading, error };
}