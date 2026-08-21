# BudgetBites - AI献立作成アプリ

[![App Store](https://img.shields.io/badge/App_Store-0D96F6?style=for-the-badge&logo=app-store&logoColor=white)](https://apps.apple.com/jp/app/ai%E7%8C%AE%E7%AB%8B%E4%BD%9C%E6%88%90%E3%82%A2%E3%83%97%E3%83%AAbudgetbiters/id6756218102)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)

## 背景

「今日の献立、何にしよう...」

毎日の食事を考えることは、多くの人にとって負担になっています。栄養バランス、予算、好み、アレルギーなど、考慮すべき要素が多く、特に忙しい現代人にとって献立を考える時間は貴重です。

**BudgetBites**は、この課題を解決するために生まれました。Google Gemini AIの力を借りて、あなたの予算と好みに合った1ヶ月分の献立を瞬時に作成します。

## 主な機能

### AI献立自動生成
Google Gemini AIが、設定した月間予算と味の好みに基づいて、**1ヶ月分（朝・昼・晩）** の献立を自動生成します。

### カレンダー管理
生成された献立はカレンダー形式で表示。気分や予定に合わせて自由に編集・入れ替えが可能です。

### 細かなカスタマイズ
- **味付けの好み**: あっさり / バランス / こってり
- **アレルギー設定**: 卵、乳製品、小麦など
- **避けたい食材**: 苦手な食材を登録

### 献立通知
設定した時間に今日の献立を通知。朝・昼・晩それぞれの時間をカスタマイズできます。

### オフライン対応
ローカルSQLiteデータベースを使用し、インターネット接続がなくても献立の確認・編集が可能です。

## 技術スタック

| カテゴリ | 技術 |
|:---|:---|
| フレームワーク | React Native 0.81, Expo 54 |
| 言語 | TypeScript 5.9 |
| ルーティング | Expo Router 6 |
| データベース | SQLite (expo-sqlite) |
| 認証 | Supabase Auth |
| AI | Google Gemini API (gemini-2.5-flash) |
| 決済 | Stripe |
| 通知 | Expo Notifications |
| バックグラウンド処理 | react-native-background-fetch |

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Screens   │  │ Components  │  │   Hooks     │              │
│  │  (app/*.tsx)│  │  (共通UI)   │  │ (カスタム)  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        State Management                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   AuthContext   │  │ TrackingContext │  │NotificationCtx  │  │
│  │   (認証状態)    │  │   (広告同意)    │  │  (通知権限)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ServiceFactory                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │MealPlanSvc  │ │ BudgetSvc   │ │NotificationSvc│         │ │
│  │  ├─────────────┤ ├─────────────┤ ├─────────────┤          │ │
│  │  │  AuthSvc    │ │ PremiumSvc  │ │SettingSvc   │          │ │
│  │  ├─────────────┤ ├─────────────┤ ├─────────────┤          │ │
│  │  │MealTimeSvc  │ │BackgroundSvc│ │             │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Repository Layer                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │MealPlanRepo │ │ BudgetRepo  │ │PreferencesRepo│ │ AuthRepo │ │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├───────────┤ │
│  │MealLogRepo  │ │ExpenseRepo  │ │MealTimeRepo │ │PremiumRepo│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              DatabaseConnection (Singleton)                 │ │
│  │  ┌─────────────────────┐    ┌─────────────────────┐        │ │
│  │  │   SQLite (Local)    │    │  Migration Manager  │        │ │
│  │  └─────────────────────┘    └─────────────────────┘        │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Supabase  │  │Google Gemini│  │   Stripe    │              │
│  │   (認証)    │  │   (AI)      │  │   (決済)    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 設計パターン

- **Repository Pattern**: データアクセスの抽象化
- **Singleton Pattern**: DatabaseConnection, ServiceFactory
- **Factory Pattern**: サービスインスタンスの生成管理
- **Context API**: グローバル状態管理

## ER図

```mermaid
erDiagram
    %% ユーザー設定
    preferences {
        INTEGER id PK "固定値: 1"
        TEXT taste_preference "light | balanced | rich"
        TEXT allergies "JSON配列"
        TEXT avoid_ingredients "JSON配列"
        TEXT created_at
        TEXT updated_at
    }

    %% 予算管理
    budgets {
        INTEGER id PK "固定値: 1"
        INTEGER total_budget "月間予算"
        INTEGER daily_budget "1日の予算"
        TEXT created_at
        TEXT updated_at
    }

    %% 献立計画
    meal_plans {
        INTEGER id PK
        TEXT date "YYYY-MM-DD"
        TEXT meal_type "breakfast | lunch | dinner"
        TEXT menu_name
        TEXT ingredients "JSON配列"
        TEXT recipe "JSON配列"
        TEXT nutrition "JSON"
        INTEGER cooking_time "分"
        INTEGER estimated_cost
        TEXT created_at
        TEXT updated_at
    }

    %% 食事記録
    meal_logs {
        INTEGER id PK
        TEXT date "YYYY-MM-DD"
        TEXT meal_type "breakfast | lunch | dinner"
        TEXT menu_name
        INTEGER actual_cost
        TEXT notes
        TEXT executed_at
        TEXT created_at
        TEXT updated_at
    }

    %% 食事時間設定
    meal_times {
        INTEGER id PK
        TEXT meal_type UK "breakfast | lunch | dinner"
        INTEGER hour
        INTEGER minute
        INTEGER enabled "0 | 1"
        TEXT created_at
    }

    %% 支出管理
    expenses {
        INTEGER id PK
        TEXT date
        INTEGER amount
        TEXT category
        TEXT description
        TEXT created_at
        TEXT updated_at
    }

    %% プレミアム状態
    premium_status {
        INTEGER id PK "固定値: 1"
        INTEGER is_premium "0 | 1"
        TEXT subscription_id
        TEXT expires_at
        TEXT created_at
        TEXT updated_at
    }

    %% 認証情報
    auth {
        INTEGER id PK "固定値: 1"
        INTEGER is_logged_in "0 | 1"
        TEXT user_id
        TEXT email
        TEXT access_token
        TEXT refresh_token
        TEXT created_at
        TEXT updated_at
    }

    %% バックアップ設定
    backup_settings {
        INTEGER id PK "固定値: 1"
        INTEGER auto_backup "0 | 1"
        TEXT last_backup_at
        TEXT created_at
        TEXT updated_at
    }

    %% AI履歴
    ai_history {
        INTEGER id PK
        TEXT action_type
        TEXT input_data
        TEXT output_data
        TEXT status
        TEXT error_message
        TEXT created_at
    }

    %% AI使用量
    ai_usage {
        INTEGER id PK
        TEXT action_type
        INTEGER prompt_tokens
        INTEGER completion_tokens
        TEXT created_at
    }

    %% スキーママイグレーション
    schema_migrations {
        INTEGER id PK
        INTEGER version UK
        TEXT name
        TEXT applied_at
    }

    %% リレーション（論理的な関連）
    preferences ||--o{ meal_plans : "好みに基づいて生成"
    budgets ||--o{ meal_plans : "予算内で生成"
    meal_plans ||--o| meal_logs : "計画 → 実績"
    meal_times ||--o{ meal_plans : "通知時間"
    auth ||--o| premium_status : "ユーザー状態"
    auth ||--o| backup_settings : "バックアップ設定"
    meal_plans ||--o{ ai_history : "AI生成履歴"
```

## ディレクトリ構成

```
app/
├── budget_bites-app/
│   ├── app/                    # 画面コンポーネント (Expo Router)
│   │   ├── _layout.tsx         # ルートレイアウト
│   │   ├── index.tsx           # ホーム画面
│   │   ├── mealPlanGenerate.tsx # 献立生成画面
│   │   ├── mealDetail.tsx      # 献立詳細画面
│   │   ├── mealTime.tsx        # 通知時間設定
│   │   ├── budgetEdit.tsx      # 予算編集
│   │   ├── preferenceSetUp.tsx # 好み設定
│   │   └── login.tsx           # ログイン画面
│   ├── components/             # 共通コンポーネント
│   ├── contexts/               # React Context
│   ├── hooks/                  # カスタムフック
│   ├── libs/                   # 外部ライブラリ連携
│   ├── repositories/           # データアクセス層
│   ├── services/               # ビジネスロジック層
│   ├── types/                  # TypeScript型定義
│   └── utils/                  # ユーティリティ関数
├── package.json
└── app.json
```

## セットアップ

### 前提条件

- Node.js 20以上
- npm または yarn
- Expo CLI
- iOS Simulator または実機

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-username/BudgetBites.git
cd BudgetBites/app/budget_bites-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要なAPIキーを設定
```

### 環境変数

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### 起動

#### 開発ビルドの作成（初回のみ）

```bash
# iOS シミュレーター用の開発ビルドを作成
npx eas-cli build --profile development-simulator --platform ios
```

#### シミュレーターへのインストールと起動

```bash
# ビルドをダウンロードしてシミュレーターにインストール
npx eas-cli build:run --platform ios

# ネイティブビルドを実行 
npx expo run:ios 
```

シミュレーターでアプリを開くと、開発サーバーに自動接続されます。

## ライセンス

このプロジェクトはプライベートリポジトリです。

## 開発者

- keito isobe

---

Made with React Native + Expo
