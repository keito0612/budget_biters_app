import * as SQLite from 'expo-sqlite';
import { MealTime } from '../types/types';

interface Migration {
    version: number;
    name: string;
    up: string[];
    down?: string[];
}

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private db: SQLite.SQLiteDatabase | null = null;
    private migrationCompleted: boolean = false;
    private readonly CURRENT_VERSION = 2;

    private constructor() { }

    static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    async connect(dbName: string = 'budgetmenu.db'): Promise<void> {
        if (this.db) return;

        this.db = await SQLite.openDatabaseAsync(dbName);

        // マイグレーションは一度だけ実行
        if (!this.migrationCompleted) {
            // マイグレーション履歴テーブルを作成
            await this.createMigrationTable();

            // 現在のバージョンを取得
            const currentVersion = await this.getCurrentVersion();
            // マイグレーションを実行
            if (currentVersion !== undefined && currentVersion < this.CURRENT_VERSION) {
                await this.runMigrations(currentVersion);
            }

            await this.initializeDefaults();
            this.migrationCompleted = true;
        }
    }

    getDatabase(): SQLite.SQLiteDatabase {
        if (!this.db) {
            throw new Error('Database not initialized. Call connect() first.');
        }
        return this.db;
    }

    async execute(query: string, params?: any[]): Promise<SQLite.SQLiteRunResult | void> {
        let result: SQLite.SQLiteRunResult | undefined = undefined;
        await this.getDatabase().withTransactionAsync(async () => {
            if (params && params.length > 0) {
                result = await this.getDatabase().runAsync(query, params);
            } else {
                await this.getDatabase().execAsync(query);
            }
        });
        if (result !== undefined) {
            return result;
        }
    }

    async query<T>(query: string, params: any[] = []): Promise<T[]> {
        return await this.getDatabase().getAllAsync<T>(query, params);
    }

    private async createMigrationTable(): Promise<void> {
        await this.getDatabase().execAsync(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER UNIQUE NOT NULL,
                name TEXT NOT NULL,
                applied_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    private async getCurrentVersion(): Promise<number> {
        try {
            const result = await this.query<{ version: number }>(
                'SELECT MAX(version) as version FROM schema_migrations'
            );
            return result[0]?.version || 0;
        } catch (error) {
            return 0;
        }
    }

    private getMigrations(): Migration[] {
        return [
            {
                version: 1,
                name: 'initial_schema',
                up: [
                    `CREATE TABLE IF NOT EXISTS preferences (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        taste_preference TEXT DEFAULT 'balanced',
                        allergies TEXT DEFAULT '[]',
                        avoid_ingredients TEXT DEFAULT '[]',
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    `CREATE TABLE IF NOT EXISTS budgets (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        total_budget INTEGER NOT NULL,
                        daily_budget INTEGER NOT NULL,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    `CREATE TABLE IF NOT EXISTS meal_plans (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT NOT NULL,
                        meal_type TEXT NOT NULL,
                        menu_name TEXT NOT NULL,
                        ingredients TEXT NOT NULL,
                        recipe TEXT NOT NULL,
                        nutrition TEXT NOT NULL,
                        cooking_time INTEGER,
                        estimated_cost INTEGER,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(date, meal_type)
                    )`,
                    `CREATE TABLE IF NOT EXISTS meal_logs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT NOT NULL,
                        meal_type TEXT NOT NULL,
                        menu_name TEXT NOT NULL,
                        actual_cost INTEGER,
                        notes TEXT,
                        executed_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(date, meal_type)
                    )`,
                    `CREATE TABLE IF NOT EXISTS expenses (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        date TEXT NOT NULL,
                        amount INTEGER NOT NULL,
                        category TEXT,
                        description TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    `CREATE TABLE IF NOT EXISTS ai_usage (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        action_type TEXT NOT NULL,
                        prompt_tokens INTEGER DEFAULT 0,
                        completion_tokens INTEGER DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    `CREATE TABLE IF NOT EXISTS premium_status (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        is_premium INTEGER DEFAULT 0,
                        subscription_id TEXT,
                        expires_at TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    `CREATE TABLE IF NOT EXISTS auth (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        is_logged_in INTEGER DEFAULT 0,
                        user_id TEXT,
                        email TEXT,
                        access_token TEXT,
                        refresh_token TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    `CREATE TABLE IF NOT EXISTS backup_settings (
                        id INTEGER PRIMARY KEY CHECK (id = 1),
                        auto_backup INTEGER DEFAULT 0,
                        last_backup_at TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`,
                    `CREATE TABLE IF NOT EXISTS ai_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        action_type TEXT NOT NULL,
                        input_data TEXT,
                        output_data TEXT,
                        status TEXT DEFAULT 'success',
                        error_message TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )`
                ],
                down: [
                    'DROP TABLE IF EXISTS preferences',
                    'DROP TABLE IF EXISTS budgets',
                    'DROP TABLE IF EXISTS meal_plans',
                    'DROP TABLE IF EXISTS meal_logs',
                    'DROP TABLE IF EXISTS expenses',
                    'DROP TABLE IF EXISTS ai_usage',
                    'DROP TABLE IF EXISTS premium_status',
                    'DROP TABLE IF EXISTS auth',
                    'DROP TABLE IF EXISTS backup_settings',
                    'DROP TABLE IF EXISTS ai_history'
                ]
            },
            {
                version: 2,
                name: 'add_meal_times',
                up: [
                    `CREATE TABLE IF NOT EXISTS meal_times (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        meal_type TEXT NOT NULL,
                        hour INTEGER NOT NULL,
                        minute INTEGER NOT NULL,
                        enabled INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(meal_type)
                    )`
                ],
                down: ['DROP TABLE IF EXISTS  meal_times']
            }
        ];
    }

    private async runMigrations(fromVersion: number): Promise<void> {
        const migrations = this.getMigrations().filter(m => m.version > fromVersion);

        for (const migration of migrations) {
            console.log(`Running migration ${migration.version}: ${migration.name}`);

            try {
                await this.getDatabase().withTransactionAsync(async () => {
                    // マイグレーションのSQL文を実行
                    for (const sql of migration.up) {
                        await this.getDatabase().execAsync(sql);
                    }

                    // マイグレーション履歴に記録
                    await this.getDatabase().runAsync(
                        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
                        [migration.version, migration.name]
                    );
                });

                console.log(`Migration ${migration.version} completed successfully`);
            } catch (error) {
                console.error(`Migration ${migration.version} failed:`, error);
                throw error;
            }
        }
    }

    // マイグレーションをロールバックする(開発用)
    async rollbackMigration(): Promise<void> {
        const currentVersion = await this.getCurrentVersion();
        if (currentVersion === 0) {
            console.log('No migrations to rollback');
            return;
        }

        const migration = this.getMigrations().find(m => m.version === currentVersion);
        if (!migration || !migration.down) {
            throw new Error(`Cannot rollback migration ${currentVersion}: no down script`);
        }

        console.log(`Rolling back migration ${currentVersion}: ${migration.name}`);

        await this.getDatabase().withTransactionAsync(async () => {
            // ロールバックのSQL文を実行
            if (migration.down !== undefined) {
                for (const sql of migration.down) {
                    await this.getDatabase().execAsync(sql);
                }
            }

            // マイグレーション履歴から削除
            await this.getDatabase().runAsync(
                'DELETE FROM schema_migrations WHERE version = ?',
                [currentVersion]
            );
        });

        console.log(`Rollback of migration ${currentVersion} completed`);
    }

    // 現在のスキーマバージョンを取得
    async getSchemaVersion(): Promise<number> {
        return await this.getCurrentVersion();
    }

    // マイグレーション履歴を取得
    async getMigrationHistory(): Promise<Array<{ version: number; name: string; applied_at: string }>> {
        return await this.query(
            'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
        );
    }

    private async checkNeedsInitialization(): Promise<boolean> {
        try {
            const result = await this.query<{ count: number }>(
                'SELECT COUNT(*) as count FROM preferences'
            );
            return result[0].count === 0; // レコードが0件なら初期化が必要
        } catch (error) {
            return true; // テーブルが存在しない場合も初期化が必要
        }
    }

    private async initializeDefaults(): Promise<void> {
        const defultMenuTimes: Array<MealTime> = [
            {
                meal_type: 'breakfast',
                hour: 7,
                minute: 0,
                enabled: true
            },
            {
                meal_type: 'lunch',
                hour: 12,
                minute: 0,
                enabled: true
            },
            {
                meal_type: 'dinner',
                hour: 18,
                minute: 0,
                enabled: true
            }
        ];
        await this.execute(`
            INSERT OR IGNORE INTO preferences(id, taste_preference, allergies, avoid_ingredients)
VALUES(1, 'balanced', '[]', '[]')
    `);
        await this.execute(`
            INSERT OR IGNORE INTO premium_status(id, is_premium)
VALUES(1, 0)
    `);
        await this.execute(`
            INSERT OR IGNORE INTO auth(id, is_logged_in)
VALUES(1, 0)
    `);
        await this.execute(`
            INSERT OR IGNORE INTO backup_settings(id, auto_backup)
VALUES(1, 0)
    `);
        await this.execute(
            'INSERT OR IGNORE INTO budgets (id, total_budget, daily_budget) VALUES(1, 0, 0)'
        );
        for (const defultMenuTime of defultMenuTimes) {
            await this.execute(
                `INSERT OR IGNORE INTO meal_times (meal_type, hour, minute) VALUES(?, ?, ?)`
                , [
                    defultMenuTime.meal_type,
                    defultMenuTime.hour,
                    defultMenuTime.minute,

                ]
            )
        }
    }
}
export const dbConnection = DatabaseConnection.getInstance();