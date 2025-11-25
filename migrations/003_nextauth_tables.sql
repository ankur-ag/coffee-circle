-- Create NextAuth required tables if they don't exist

CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    sessionToken TEXT NOT NULL UNIQUE,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires INTEGER NOT NULL,
    PRIMARY KEY (identifier, token)
);
