# WBS-Boaid (業務進捗管理システム)

情報システム部におけるテレワーク勤務を支援するための、業務進捗管理システムです。
年間目標の月次管理、開発プロジェクト管理、FAQ（問い合わせ）管理、および日次ルーチン業務の可視化を行います。

## 主な機能

- **年間目標・月次進捗管理**: 部門目標に紐づくタスクの進捗を月単位で管理。
- **開発業務管理**: 中長期の開発案件をプロジェクト単位で管理し、タスクごとの進捗履歴を保持。
- **FAQ管理**: 日々の問い合わせ内容を蓄積し、担当者ごとの対応状況を管理。
- **日次ルーチン管理**: 毎日発生する定型業務の実施チェック。
- **管理者機能**: ユーザー管理、パスワードリセット、全体状況のダッシュボード表示。
- **認証**: JWTによる認証、初回ログイン時のパスワード変更強制機能。

## 技術スタック

- **Frontend**: React, TypeScript, React Router, CSS
- **Backend**: Node.js, Express, TypeScript, SQLite
- **Database**: SQLite3 (PrismaやTypeORMを使用しないシンプルな実装)

## セットアップ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/JIRO-MIYATA/WBS-Boaid.git
cd WBS-Boaid
```

### 2. バックエンドのセットアップ
```bash
cd backend
npm install
# .env.example を参考に .env を作成
cp .env.example .env
npm run dev
```

### 3. フロントエンドのセットアップ
```bash
cd frontend
npm install
npm start
```

## ドキュメント

詳細な仕様については以下のドキュメントを参照してください。

- [利用マニュアル (USER_MANUAL.md)](./USER_MANUAL.md)
- [要件定義書 (REQUIREMENTS.md)](./REQUIREMENTS.md)
- [画面設計書 (SCREENS.md)](./SCREENS.md)
- [テーブル定義書 (TABLES.md)](./TABLES.md)
- [API仕様書 (API.md)](./API.md)
- [実装タスク一覧 (TASKS.md)](./TASKS.md)

## ライセンス

Copyright (c) 2026 JIRO-MIYATA
