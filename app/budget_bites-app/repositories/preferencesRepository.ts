
import { dbConnection } from "../database/databaseConnection";
import { Preferences } from "../types/types";

export interface PreferencesRepository {
    get(): Promise<Preferences>;
    update(preferences: Partial<Preferences>): Promise<void>;
}


export class PreferencesRepositoryImpl implements PreferencesRepository {
    async get(): Promise<Preferences> {
        const rows = await dbConnection.query<any>(
            'SELECT * FROM preferences WHERE id = 1'
        );
        const row = rows[0];
        return {
            ...row,
            allergies: JSON.parse(row.allergies),
            avoid_ingredients: JSON.parse(row.avoid_ingredients),
        };
    }

    async update(preferences: Partial<Preferences>): Promise<void> {
        const updates: string[] = [];
        const values: any[] = [];

        if (preferences.taste_preference) {
            updates.push('taste_preference = ?');
            values.push(preferences.taste_preference);
        }
        if (preferences.allergies!.length !== 0) {
            updates.push('allergies = ?');
            values.push(JSON.stringify(preferences.allergies));
        }
        if (preferences.avoid_ingredients!.length !== 0) {
            updates.push('avoid_ingredients = ?');
            values.push(JSON.stringify(preferences.avoid_ingredients));
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        await dbConnection.execute(
            `UPDATE preferences SET ${updates.join(', ')} WHERE id = 1`,
            values
        );
    }
}