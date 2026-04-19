# TABLES.md
# 情報システム部 テレワーク向け業務進捗管理システム テーブル定義書

## 1. 方針
- 本システムは、年間目標の月次進捗管理と、日々のルーチン業務管理を行う。
- 利用者はメールアドレスをログインIDとして使用する。
- 初期パスワードは運用上設定するが、DBには平文で保存しない。
- パスワードはハッシュ化して保存する。
- 初回ログイン時はパスワード変更必須とする。
- 論理削除を基本とし、必要に応じて有効/無効フラグで管理する。
- 日付・時刻は原則として `created_at` `updated_at` を持つ。
- 主キーは原則 `id` とし、数値の自動採番を想定する。

---

## 2. テーブル一覧
1. roles
2. users
3. annual_goals
4. goal_assignments
5. monthly_goal_progress
6. daily_tasks
7. daily_task_histories
8. password_reset_logs
9. notifications

---

## 3. テーブル定義

### 3.1 roles
役割マスタ。一般部員と管理者を管理する。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | 役割ID |
| role_code | varchar(50) | NO | UK | 役割コード（member, admin） |
| role_name | varchar(100) | NO |  | 役割名 |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 備考
- 初期データとして以下を登録する。
  - `member` : 一般部員
  - `admin` : 管理者

---

### 3.2 users
利用者テーブル。メールアドレスでログインする。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | ユーザーID |
| role_id | bigint | NO | FK | roles.id |
| employee_code | varchar(50) | YES | UK | 社員番号など任意 |
| user_name | varchar(100) | NO |  | 氏名 |
| email | varchar(255) | NO | UK | ログインIDとして使うメールアドレス |
| department_name | varchar(100) | YES |  | 所属名 |
| password_hash | varchar(255) | NO |  | ハッシュ化済みパスワード |
| first_login_required | tinyint(1) | NO |  | 初回ログイン時パスワード変更必須フラグ |
| is_active | tinyint(1) | NO |  | 有効/無効フラグ |
| last_login_at | datetime | YES |  | 最終ログイン日時 |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 備考
- 初期登録時はメールアドレスを一意にする。
- 初期パスワード `elpa1234` はDBには保存せず、ハッシュ化して保存する。
- 初期登録時は `first_login_required = 1` とする。

---

### 3.3 annual_goals
部門の年間目標を管理するテーブル。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | 年間目標ID |
| fiscal_year | int | NO | IDX | 対象年度 |
| goal_code | varchar(50) | NO | UK | 年間目標コード |
| goal_title | varchar(255) | NO |  | 年間目標名 |
| goal_description | text | YES |  | 詳細説明 |
| start_date | date | YES |  | 開始日 |
| end_date | date | YES |  | 終了日 |
| owner_user_id | bigint | YES | FK | 主管理者 users.id |
| status | varchar(30) | NO |  | 状態（draft, active, closed） |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 備考
- 年度単位で管理する。
- 1つの年間目標を複数人へ割り当てる場合は `goal_assignments` を使う。

---

### 3.4 goal_assignments
年間目標を個人へ細分化して割り当てるテーブル。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | 割当ID |
| annual_goal_id | bigint | NO | FK | annual_goals.id |
| assigned_user_id | bigint | NO | FK | users.id |
| assignment_title | varchar(255) | NO |  | 個人割当タイトル |
| assignment_description | text | YES |  | 個人割当詳細 |
| priority | varchar(20) | YES |  | 優先度（low, medium, high） |
| due_date | date | YES |  | 期限 |
| status | varchar(30) | NO |  | 状態（active, completed, on_hold） |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 備考
- 年間目標1件に対し、複数の個人割当を持てる。
- 担当者単位の進捗入力は `monthly_goal_progress` で管理する。

---

### 3.5 monthly_goal_progress
年間目標の個人割当に対する月次進捗を管理するテーブル。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | 月次進捗ID |
| goal_assignment_id | bigint | NO | FK | goal_assignments.id |
| target_year | int | NO | IDX | 対象年 |
| target_month | int | NO | IDX | 対象月（1〜12） |
| progress_percent | decimal(5,2) | NO |  | 進捗率（0〜100） |
| progress_comment | text | YES |  | 進捗コメント |
| delay_reason | text | YES |  | 遅延理由 |
| next_month_plan | text | YES |  | 次月予定 |
| submitted_by | bigint | NO | FK | users.id |
| submitted_at | datetime | YES |  | 提出日時 |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 一意制約
- `goal_assignment_id + target_year + target_month` は一意とする。

#### 備考
- 同じ担当・同じ年月で複数登録されないようにする。
- 月次進捗未入力チェックはこのテーブルで判定する。

---

### 3.6 daily_tasks
日々のルーチン業務を管理するテーブル。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | 日次業務ID |
| task_code | varchar(50) | YES | UK | 業務管理番号 |
| title | varchar(255) | NO |  | 件名 |
| task_detail | text | YES |  | 内容 |
| task_type | varchar(100) | YES |  | 業務種別（問い合わせ、障害、改善など） |
| requester_name | varchar(100) | YES |  | 依頼元名称 |
| requester_email | varchar(255) | YES |  | 依頼元メール |
| assigned_user_id | bigint | NO | FK | users.id |
| status | varchar(30) | NO | IDX | 未着手/対応中/完了/保留 |
| progress_percent | decimal(5,2) | NO |  | 進捗率 |
| hold_reason | text | YES |  | 保留理由 |
| start_date | date | YES |  | 対応開始日 |
| due_date | date | YES |  | 目安期限 |
| completed_at | datetime | YES |  | 完了日時 |
| last_progress_at | datetime | YES |  | 最終進捗更新日時 |
| created_by | bigint | NO | FK | users.id |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### ステータス制御ルール
- 未着手: `progress_percent = 0`
- 対応中: `progress_percent = 1〜99`
- 完了: `progress_percent = 100`
- 保留: `hold_reason` 必須

#### 備考
- 一覧画面では担当者、ステータス、業務種別、更新日で絞り込みできる想定。
- 停滞案件は `last_progress_at` を基準に抽出する。

---

### 3.7 daily_task_histories
日次業務の更新履歴を管理するテーブル。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | 履歴ID |
| daily_task_id | bigint | NO | FK | daily_tasks.id |
| changed_by | bigint | NO | FK | users.id |
| old_status | varchar(30) | YES |  | 変更前ステータス |
| new_status | varchar(30) | YES |  | 変更後ステータス |
| old_progress_percent | decimal(5,2) | YES |  | 変更前進捗率 |
| new_progress_percent | decimal(5,2) | YES |  | 変更後進捗率 |
| comment_text | text | YES |  | 更新コメント |
| changed_at | datetime | NO |  | 変更日時 |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 備考
- 誰が、いつ、どのように更新したかを追跡する。
- 監査や振り返りに利用する。

---

### 3.8 password_reset_logs
パスワード初期化・変更履歴を管理するテーブル。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | ログID |
| user_id | bigint | NO | FK | users.id |
| reset_type | varchar(30) | NO |  | 種別（initial, admin_reset, self_change） |
| reset_by | bigint | YES | FK | users.id |
| executed_at | datetime | NO |  | 実行日時 |
| note | text | YES |  | 備考 |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 備考
- 初回登録、管理者初期化、本人変更の履歴を残す。
- セキュリティ監査向けのログとして利用する。

---

### 3.9 notifications
通知管理テーブル。

| カラム名 | 型 | NULL | キー | 説明 |
|---|---|---|---|---|
| id | bigint | NO | PK | 通知ID |
| user_id | bigint | NO | FK | users.id |
| notification_type | varchar(50) | NO |  | 通知種別（月次リマインド、停滞案件など） |
| title | varchar(255) | NO |  | 通知タイトル |
| body | text | YES |  | 通知本文 |
| is_read | tinyint(1) | NO |  | 既読フラグ |
| sent_at | datetime | YES |  | 通知送信日時 |
| read_at | datetime | YES |  | 既読日時 |
| created_at | datetime | NO |  | 作成日時 |
| updated_at | datetime | NO |  | 更新日時 |

#### 備考
- 初期はDB保存のみでもよい。
- 将来的にメール送信やTeams通知へ拡張しやすい構造にする。

---

## 4. リレーション概要

### 4.1 認証・権限
- roles 1 --- n users

### 4.2 年間目標
- annual_goals 1 --- n goal_assignments
- users 1 --- n goal_assignments
- goal_assignments 1 --- n monthly_goal_progress
- users 1 --- n monthly_goal_progress

### 4.3 日次業務
- users 1 --- n daily_tasks
- daily_tasks 1 --- n daily_task_histories
- users 1 --- n daily_task_histories

### 4.4 通知・パスワード管理
- users 1 --- n notifications
- users 1 --- n password_reset_logs

---

## 5. インデックス案

### users
- UNIQUE: email
- INDEX: role_id
- INDEX: is_active

### annual_goals
- UNIQUE: goal_code
- INDEX: fiscal_year
- INDEX: status

### goal_assignments
- INDEX: annual_goal_id
- INDEX: assigned_user_id
- INDEX: status

### monthly_goal_progress
- UNIQUE: goal_assignment_id, target_year, target_month
- INDEX: target_year, target_month

### daily_tasks
- UNIQUE: task_code
- INDEX: assigned_user_id
- INDEX: status
- INDEX: task_type
- INDEX: last_progress_at

### daily_task_histories
- INDEX: daily_task_id
- INDEX: changed_at

### notifications
- INDEX: user_id
- INDEX: is_read
- INDEX: notification_type

---

## 6. 実装ルール

### 6.1 パスワード
- パスワードは必ずハッシュ化して保存する。
- 初期パスワード文字列そのものはログや画面に保持しない。
- 初回ログイン時はパスワード変更完了まで他画面へ進ませない。

### 6.2 日次業務の進捗率
- 未着手は 0%
- 対応中は 1〜99%
- 完了は 100%
- 保留は進捗率そのままでもよいが、保留理由を必須にする
- ステータス変更時はAPI側で整合性を検証する

### 6.3 月次進捗
- 月次進捗は担当者ごと、年月ごとに1件のみ登録可能にする
- 入力期限や未入力判定はアプリケーション側の業務ルールで管理する

---

## 7. AIへの指示
以下をこのテーブル定義書に従って実施すること。

1. DB作成用のDDLを作成する
2. 外部キー制約を含めた migration を作成する
3. 初期データとして roles を投入する
4. 管理者ユーザー1件と一般部員ユーザー数件の seed を作成する
5. users テーブルの初期登録時は first_login_required を ON にする
6. daily_tasks のステータスと progress_percent の整合性チェックをAPI側で実装する
7. monthly_goal_progress の年月重複登録を禁止する