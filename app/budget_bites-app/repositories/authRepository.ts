import { dbConnection } from '../database/databaseConnection';
import { AuthState } from '../types/types';


export interface AuthRepository {
    get: () => Promise<AuthState>;
    update: (state: Partial<AuthState>) => Promise<void>;
}

export class AuthRepositoryImpl implements AuthRepository {
    async get(): Promise<AuthState> {
        const rows = await dbConnection.query<any>(
            'SELECT * FROM auth WHERE id = 1'
        );
        return {
            ...rows[0],
            is_logged_in: Boolean(rows[0].is_logged_in),
        };
    }

    async update(state: Partial<AuthState>): Promise<void> {
        const updates: string[] = [];
        const values: any[] = [];

        if (state.is_logged_in !== undefined) {
            updates.push('is_logged_in = ?');
            values.push(state.is_logged_in ? 1 : 0);
        }
        if (state.user_id !== undefined) {
            updates.push('user_id = ?');
            values.push(state.user_id);
        }
        if (state.email !== undefined) {
            updates.push('email = ?');
            values.push(state.email);
        }
        if (state.access_token !== undefined) {
            updates.push('access_token = ?');
            values.push(state.access_token);
        }
        if (state.refresh_token !== undefined) {
            updates.push('refresh_token = ?');
            values.push(state.refresh_token);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        await dbConnection.execute(
            `UPDATE auth SET ${updates.join(', ')} WHERE id = 1`,
            values
        );
    }
}