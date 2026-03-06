# Invoice System – Backend

Node.js + Express API with PostgreSQL, secure auth (register, login, JWT).

## Setup

1. **PostgreSQL** – Install and start PostgreSQL. Default user is often `postgres`.

2. **Environment**

   ```bash
   npm install
   cp .env.example .env
   ```

   Edit `.env`:
   - `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/invoice_system`
   - `JWT_SECRET` – set to a long random string (e.g. 32+ chars) in production

3. **Create the database** (first time only)

   ```bash
   npm run db:create
   ```

   This creates the `invoice_system` database if it does not exist. Tables are created automatically when the server starts.

## Run

```bash
npm run dev   # dev with tsx watch
npm run build && npm start   # production
```

- API: `http://localhost:3000`
- Health: `GET /api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (Bearer token)

## PostgreSQL on VPS

On the VPS server, create the database and a dedicated user:

1. **Edit the script** `scripts/setup-vps-db.sql`: replace `myuser` and `mypassword` with your chosen DB user and password.

2. **Run the script** (on the VPS, as postgres superuser):

   ```bash
   cd /path/to/server
   sudo -u postgres psql -f scripts/setup-vps-db.sql
   ```

   Or connect first then run the file:

   ```bash
   sudo -u postgres psql
   \i scripts/setup-vps-db.sql
   \q
   ```

3. **Set `.env` on the VPS**:

   ```env
   DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/invoice_system
   ```

   If the app runs on the same host as PostgreSQL, use `localhost`. If DB is on another host, use that host (and ensure `pg_hba.conf` allows the app server).

4. **Start the app** – Tables are created automatically on first start (`initDb()`).

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT for sessions (set `JWT_SECRET` in production)
- Rate limiting on `/api/auth` (10 requests / 15 min)
- Helmet, CORS (configure `CORS_ORIGIN`)
