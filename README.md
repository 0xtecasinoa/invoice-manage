# 建設業向け 請求管理システム

見積から施工記録、請求書発行、提出管理、原価管理までを一気通貫で扱う、建設業向けの業務管理 Web アプリケーションです。フロントエンドに React、バックエンドに Express + PostgreSQL を採用しています。

---

## 主な特長

- **ワークフロー管理** — 「見積 → 施工記録 → 請求 → 提出 → 原価」という一連の業務フローを、案件（プロジェクト）単位でステータス管理します。
- **見積作成** — 案件ごとに明細（工種名・品名・規格・数量・単価・税区分）を入力し、小計・消費税・合計を自動計算します。
- **施工記録** — 現場ごとの施工内容を日付・数量・単価とともに記録し、請求明細へ反映できます。
- **請求書発行** — 「自社書式」と「元請書式」の 2 種類に対応。インボイス制度（適格請求書）の税区分にも対応しています。
- **PDF / Excel 出力** — 作成した請求書を PDF（jsPDF）および Excel（SheetJS）形式で出力できます。
- **提出管理** — 請求書の提出状況（提出済・受理・差戻し・再提出要）を一覧で管理します。
- **原価管理** — 案件ごとに予算額と実績額を登録し、差額を可視化します。
- **ダッシュボード** — 案件一覧・統計カード・ワークフローパイプラインで全体状況を把握できます。
- **認証** — メールアドレス＋パスワード認証に加え、Google OAuth ログインに対応。パスワードは bcrypt でハッシュ化し、セッションは JWT で管理します。

---

## ステータス（ワークフロー）

| ステータス | 表示名 |
| --- | --- |
| `estimate_draft` | 見積作成中 |
| `estimate_submitted` | 見積提出済 |
| `recording` | 施工中 |
| `record_complete` | 施工完了 |
| `invoice_draft` | 請求書作成中 |
| `invoice_ready` | 請求書完成 |
| `submitted` | 提出済 |
| `resubmitted` | 再提出済 |
| `cost_pending` | 原価確認中 |
| `cost_complete` | 原価確定 |

### 対応する税区分（インボイス制度）

`対象外` / `課税仕入10%外税` / `課税仕入10%内税` / `課税仕入8%(軽減)外税` / `課税仕入8%(軽減)内税` / `課税仕入8%外税` / `課税仕入8%内税`

---

## 技術スタック

### フロントエンド（`client/`）

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn-ui**（Radix UI ベース）
- **React Router**（画面遷移）
- **TanStack Query**（サーバー状態管理）
- **React Hook Form** + **Zod**（フォーム・バリデーション）
- **jsPDF** / **html2canvas**（PDF 出力）、**SheetJS（xlsx）**（Excel 出力）
- **Vitest** + **Testing Library**（テスト）

### バックエンド（`server/`）

- **Node.js** + **Express 4** + **TypeScript**
- **PostgreSQL**（`pg`）
- **JWT**（`jsonwebtoken`）+ **bcrypt**（パスワードハッシュ化）
- **Zod**（バリデーション）
- **Helmet** / **CORS** / **express-rate-limit**（セキュリティ）

---

## ディレクトリ構成

```text
code/
├─ client/                  # フロントエンド（Vite + React）
│  ├─ src/
│  │  ├─ components/        # 共通コンポーネント・UI（shadcn-ui）
│  │  ├─ contexts/          # 認証コンテキスト
│  │  ├─ lib/               # API クライアント・PDF/Excel 出力・自社情報
│  │  ├─ pages/             # 各画面（見積・記録・請求・提出・原価・設定 ほか）
│  │  └─ types/             # 型定義（ワークフロー・明細・案件 ほか）
│  └─ vite.config.ts
└─ server/                  # バックエンド（Express + PostgreSQL）
   ├─ src/
   │  ├─ routes/            # API ルート（auth/projects/records/invoices ほか）
   │  ├─ middleware/        # 認証ミドルウェア
   │  ├─ db/                # DB 接続・スキーマ定義
   │  └─ validation/        # 入力バリデーション
   └─ scripts/              # DB 作成スクリプト
```

---

## セットアップ

### 前提条件

- **Node.js**（npm 同梱）
- **PostgreSQL**（インストール済みかつ起動していること）

### 1. リポジトリの取得

```bash
git clone <YOUR_GIT_URL>
cd Invoice-system/code
```

### 2. バックエンドのセットアップ（`server/`）

```bash
cd server
npm install
cp .env.example .env
```

`.env` を環境に合わせて編集します。

| 変数 | 説明 | 例 |
| --- | --- | --- |
| `PORT` | API サーバーのポート | `3000` |
| `DATABASE_URL` | PostgreSQL の接続文字列 | `postgresql://postgres:PASSWORD@localhost:5432/invoice_system` |
| `JWT_SECRET` | JWT 署名用シークレット（本番は 32 文字以上のランダム文字列） | `your-long-random-secret-...` |
| `JWT_EXPIRES_IN` | トークン有効期限 | `7d` |
| `CORS_ORIGIN` | フロントエンドの URL | `http://localhost:8080` |
| `FRONTEND_URL` | OAuth 後のリダイレクト先 | `http://localhost:8080` |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアント ID（任意） | |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット（任意） | |

データベースを作成します（初回のみ）。

```bash
npm run db:create
```

> `invoice_system` データベースが存在しない場合に作成します。テーブルはサーバー起動時に自動生成されます。

バックエンドを起動します。

```bash
npm run dev          # 開発（tsx watch による自動リロード）
# 本番ビルド・起動
npm run build && npm start
```

- API: `http://localhost:3000`
- ヘルスチェック: `GET /api/health`

### 3. フロントエンドのセットアップ（`client/`）

```bash
cd ../client
npm install
cp .env.example .env   # VITE_API_URL を API の URL に合わせる
npm run dev
```

ブラウザで `http://localhost:8080` を開きます。

| 変数 | 説明 | 例 |
| --- | --- | --- |
| `VITE_API_URL` | バックエンド API の URL | `http://localhost:3000` |

---

## 主な API エンドポイント

| メソッド・パス | 説明 |
| --- | --- |
| `POST /api/auth/register` | ユーザー登録 |
| `POST /api/auth/login` | ログイン |
| `GET /api/auth/me` | ログイン中ユーザー情報の取得（要 Bearer トークン） |
| `GET /api/auth/google` | Google OAuth ログイン開始 |
| `GET /api/auth/google/callback` | Google OAuth コールバック |
| `/api/projects` | 案件（見積・ワークフロー）管理 |
| `/api/records` | 施工記録の管理 |
| `/api/invoices` | 請求書の管理 |
| `/api/submissions` | 提出状況の管理 |
| `/api/costs` | 原価エントリの管理 |
| `/api/client-formats` | 元請書式テンプレートの管理 |

---

## テスト

```bash
cd client
npm test          # 単体実行
npm run test:watch  # ウォッチモード
```

---

## 本番（VPS）への PostgreSQL 構築

VPS 上では、専用のデータベースとユーザーを作成して運用します。

1. `server/scripts/setup-vps-db.sql` を編集し、`myuser` / `mypassword` を任意の DB ユーザー・パスワードに置き換えます。
2. スーパーユーザー（postgres）でスクリプトを実行します。

   ```bash
   cd /path/to/server
   sudo -u postgres psql -f scripts/setup-vps-db.sql
   ```

3. VPS 上の `.env` に接続文字列を設定します。

   ```env
   DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/invoice_system
   ```

   > アプリと DB が同一ホストの場合は `localhost`、別ホストの場合はそのホスト名を指定し、`pg_hba.conf` でアプリサーバーからの接続を許可してください。

4. アプリを起動すると、初回起動時にテーブルが自動生成されます（`initDb()`）。

---

## セキュリティ

- パスワードは **bcrypt（12 ラウンド）** でハッシュ化
- セッションは **JWT** で管理（本番では `JWT_SECRET` を必ず設定）
- `/api/auth` には **レートリミット**（15 分あたり 100 リクエスト）を適用
- **Helmet** によるセキュリティヘッダー付与、**CORS**（`CORS_ORIGIN` で許可元を設定）

---

## ライセンス

本リポジトリのライセンスについては、リポジトリ管理者にお問い合わせください。
