-- PostgreSQL setup for Invoice System on VPS
-- Run as superuser (postgres): psql -U postgres -f setup-vps-db.sql
-- Or from shell: sudo -u postgres psql -f setup-vps-db.sql
--
-- Before running: replace myuser and mypassword with your chosen DB user and password.

CREATE DATABASE invoice_system;

CREATE USER myuser WITH PASSWORD 'mypassword';

ALTER ROLE myuser SET client_encoding TO 'utf8';
ALTER ROLE myuser SET default_transaction_isolation TO 'read committed';
ALTER ROLE myuser SET timezone TO 'UTC';

-- Grant connect and use database
GRANT ALL PRIVILEGES ON DATABASE invoice_system TO myuser;

-- Required so the app can create tables (public schema)
\c invoice_system
GRANT ALL ON SCHEMA public TO myuser;
GRANT CREATE ON SCHEMA public TO myuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO myuser;
