# API.md
# 情報システム部 テレワーク向け業務進捗管理システム API仕様書

## 1. 共通仕様

### 1.1 基本エンドポイント
- ベースURL: `/api/v1`
- リクエスト / レスポンスのデータ形式: `application/json`

### 1.2 認証・認可
- ログイン成功時に発行されるトークン（またはセッションCookie）を利用する。
- 認証が必要なエンドポイントでは、ヘッダーに `Authorization: Bearer <token>` を付与する（またはCookieを送信する）。
- 管理者権限が必要なAPI（ユーザー管理など）に一般部員がアクセスした場合は `403 Forbidden` を返す。

### 1.3 エラーレスポンス共通フォーマット
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります。",
    "details": {
      "progress_percent": ["ステータスが未着手の場合、進捗率は0にしてください。"]
    }
  }
}
```
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 未認証・トークン切れ
- `403 Forbidden`: 権限エラー・初回パスワード変更未完了によるアクセスブロック
- `404 Not Found`: リソースが存在しない
- `500 Internal Server Error`: サーバーエラー

---

## 2. 認証API (Auth)

### `POST /auth/login`
- **概要**: メールアドレスとパスワードでログインする。
- **リクエスト**: `email`, `password`
- **レスポンス**: トークン、ユーザー情報（`first_login_required` フラグを含む）。
- **特記事項**: `first_login_required` が `true` の場合、クライアントはパスワード変更画面へ遷移させること。

### `POST /auth/logout`
- **概要**: ログアウト処理（トークン無効化、セッション破棄）。

### `GET /auth/me`
- **概要**: 現在ログイン中のユーザー情報を取得する。
- **レスポンス**: ユーザー情報（権限情報含む）。

### `POST /auth/change-password`
- **概要**: 初回ログイン時、または任意のパスワード変更。
- **リクエスト**: `current_password`, `new_password`, `new_password_confirmation`
- **処理**:
  - パスワード更新成功後、`users` テーブルの `first_login_required` を `false` に更新する。
  - `password_reset_logs` に履歴を記録する。

---

## 3. ユーザー管理API (Users)

### `GET /users`
- **概要**: ユーザー一覧を取得する（担当者選択用などに全ユーザーが利用可能）。

### `POST /users` (管理者専用)
- **概要**: ユーザーを新規作成する。

### `PUT /users/:id` (管理者専用)
- **概要**: ユーザー情報を更新する。

### `DELETE /users/:id` (管理者専用)
- **概要**: ユーザーを削除する。

### `POST /users/:id/reset-password` (管理者専用)
- **概要**: パスワードを初期状態にリセットする。

---

## 4. 年間目標・月次進捗API (Goals)

### `GET /goals`
- **概要**: 年間目標および個人割当の一覧を取得する。

### `POST /goals`
- **概要**: 年間目標を新規作成する（全認証ユーザー可能）。

### `POST /goals/:id/assignments`
- **概要**: 年間目標を特定のユーザーに割り当てる。

---

## 5. 開発プロジェクトAPI (Developments)

### `GET /developments`
- **概要**: 開発プロジェクトの一覧を取得する。

### `POST /developments`
- **概要**: 新規開発プロジェクトを作成する。

### `PUT /developments/:id`
- **概要**: 開発プロジェクト情報を更新する。

### `DELETE /developments/:id`
- **概要**: 開発プロジェクトを削除する。

### `GET /developments/:id/tasks`
- **概要**: プロジェクト配下のタスク一覧を取得する。

### `POST /developments/:id/tasks`
- **概要**: プロジェクトにタスクを追加する。

### `POST /developments/tasks/:taskId/progress`
- **概要**: タスクの進捗を更新し、履歴を記録する。

---

## 6. FAQ管理API (FAQs)

### `GET /faqs`
- **概要**: FAQ（問い合わせ）の一覧を取得する。

### `POST /faqs`
- **概要**: 新規FAQを登録する。

### `PUT /faqs/:id`
- **概要**: FAQを更新する。

### `DELETE /faqs/:id`
- **概要**: FAQを削除する。

---

## 7. 日次ルーチン業務API (Routines)

### `GET /routines`
- **概要**: ユーザーごとのルーチン業務マスタを取得する。

### `POST /routines`
- **概要**: ルーチン業務を登録する。

### `GET /daily-history`
- **概要**: 指定した日付のルーチン実施履歴を取得する。

### `POST /daily-history`
- **概要**: ルーチン業務の実施状況を記録・更新する。

---

## 8. ダッシュボードAPI (Dashboard)

### `GET /dashboard/stats`
- **概要**: ダッシュボード用の統計情報（タスク数、アラート等）を取得する。

---

## 7. AIへの実装指示
- 実装を開始する際、まずは `2. 認証API` と `3. ユーザー管理API` から着手すること。
- APIの入力値バリデーションは、必ずルーティングの直後（コントローラーまたはミドルウェア層）で行い、不正なデータがDBに到達しないようにすること。
- `first_login_required` が `true` のユーザーは、`POST /auth/change-password` と `POST /auth/logout` 以外の認証必須APIを叩けないよう、共通ミドルウェアでブロックすること。