import * as SQLite from 'expo-sqlite';

export class DatabaseConnection {
    private static instance: DatabaseConnection;
    private db: SQLite.SQLiteDatabase | null = null;

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
        await this.createTables();
        await this.initializeDefaults();
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
                // パラメータあり → runAsync を使う。データを追加、編集、削除するときに使う。
                result = await this.getDatabase().runAsync(query, params);
            } else {
                // パラメータなし → execAsync を使う。データを作成。複数の処理を一つにしたいときに使う。
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

    private async createTables(): Promise<void> {
        const tables = [
            `CREATE TABLE IF NOT EXISTS preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taste_preference TEXT DEFAULT 'balanced',
        allergies TEXT DEFAULT '[]',
        avoid_ingredients TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
            `CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL UNIQUE,
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
      )`,
        ];

        for (const table of tables) {
            await this.execute(table);
        }
    }

    private async initializeDefaults(): Promise<void> {
        await this.execute(`
      INSERT OR IGNORE INTO preferences (id, taste_preference, allergies, avoid_ingredients)
      VALUES (1, 'balanced', '[]', '[]')
    `);
        await this.execute(`
      INSERT OR IGNORE INTO premium_status (id, is_premium)
      VALUES (1, 0)
    `);
        await this.execute(`
      INSERT OR IGNORE INTO auth (id, is_logged_in)
      VALUES (1, 0)
    `);
        await this.execute(`
      INSERT OR IGNORE INTO backup_settings (id, auto_backup)
      VALUES (1, 0)
    `);
    }
}

export const dbConnection = DatabaseConnection.getInstance();
