-- Drop incorrectly named tables
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS verification_tokens;

-- Create NextAuth tables with correct singular names matching the schema

CREATE TABLE IF NOT EXISTS account (
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
    PRIMARY KEY (provider, providerAccountId)
);

CREATE TABLE IF NOT EXISTS session (
    sessionToken TEXT PRIMARY KEY,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verificationToken (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires INTEGER NOT NULL,
    PRIMARY KEY (identifier, token)
);
