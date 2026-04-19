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

## 3. ユーザー管理API (Users) ※管理者専用

### `GET /users`
- **概要**: ユーザー一覧を取得する。

### `POST /users`
- **概要**: ユーザーを新規作成する。
- **リクエスト**: `user_name`, `email`, `role_code`, `department_name`
- **処理**:
  - 初期パスワード（例: `elpa1234`）をハッシュ化して保存する。
  - `first_login_required` を `true` に設定する。

### `PUT /users/:id`
- **概要**: ユーザー情報を更新する（有効/無効フラグの切り替えなど）。

### `POST /users/:id/reset-password`
- **概要**: 管理者がユーザーのパスワードを初期状態（`elpa1234`）にリセットする。
- **処理**: リセット後、再度 `first_login_required = true` にする。

---

## 4. 年間目標・月次進捗API (Goals)

### `GET /goals`
- **概要**: 年間目標および個人割当の一覧を取得する。年度でフィルタリング可能。

### `POST /goals`
- **概要**: 年間目標を新規作成する（管理者のみ）。

### `POST /goals/:id/assignments`
- **概要**: 年間目標を特定のユーザーに割り当てる（タスク細分化）。

### `GET /monthly-progress`
- **概要**: 自身または全部員の月次進捗一覧を取得する。対象年月でフィルタリング。

### `POST /monthly-progress`
- **概要**: 月次進捗を登録・更新する。
- **リクエスト**: `goal_assignment_id`, `target_year`, `target_month`, `progress_percent`, `progress_comment`, `delay_reason`, `next_month_plan`
- **バリデーション**:
  - `target_year` と `target_month` の組み合わせが、同じ `goal_assignment_id` で既に存在する場合は `400 Error`（重複登録禁止）。
  - `progress_percent` は 0〜100 の数値であること。

---

## 5. 日次ルーチン業務API (Daily Tasks)

### `GET /daily-tasks`
- **概要**: 日次業務の一覧を取得する。
- **パラメータ**: `status`, `assigned_user_id`, `task_type` 等で絞り込み。

### `POST /daily-tasks`
- **概要**: 日次業務を新規登録する。
- **リクエスト**: `title`, `task_detail`, `task_type`, `status`, `progress_percent`, `hold_reason` 等。
- **バリデーション**: 下記「ステータス整合性ルール」を適用。

### `PUT /daily-tasks/:id`
- **概要**: 日次業務を更新する。
- **バリデーション**:
  - **ステータス整合性ルール（必須）**
    - `status = '未着手'` の場合、`progress_percent` は必ず `0` であること。
    - `status = '対応中'` の場合、`progress_percent` は `1`〜`99` であること。
    - `status = '完了'` の場合、`progress_percent` は必ず `100` であること。
    - `status = '保留'` の場合、`hold_reason`（保留理由）が空ではないこと。
- **処理**: 更新前の値と差分がある場合、`daily_task_histories` テーブルに更新履歴を自動記録する。

### `GET /daily-tasks/:id/histories`
- **概要**: 特定の日次業務の更新履歴（タイムライン）を取得する。

---

## 6. ダッシュボードAPI (Dashboard)

### `GET /dashboard/monthly-summary`
- **概要**: ダッシュボード用の月次進捗サマリーを取得する。
- **レスポンス**:
  - 目標ごとの平均進捗率
  - 遅延フラグが立っている案件数
  - 未入力の担当者リスト

### `GET /dashboard/daily-summary`
- **概要**: ダッシュボード用の日次業務サマリーを取得する。
- **レスポンス**:
  - 担当者別の「未着手」「対応中」「完了」「保留」件数
  - 長期停滞中（例: 3日以上更新がない「対応中」）のタスク一覧

---

## 7. AIへの実装指示
- 実装を開始する際、まずは `2. 認証API` と `3. ユーザー管理API` から着手すること。
- APIの入力値バリデーションは、必ずルーティングの直後（コントローラーまたはミドルウェア層）で行い、不正なデータがDBに到達しないようにすること。
- `first_login_required` が `true` のユーザーは、`POST /auth/change-password` と `POST /auth/logout` 以外の認証必須APIを叩けないよう、共通ミドルウェアでブロックすること。