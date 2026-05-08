CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS university (
    id UUID PRIMARY KEY DEFAULT  gen_random_uuid(),
    name TEXT NOT NULL,
    repo_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS thesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    abstract TEXT,
    year INT,
    url TEXT NOT NULL,
    university_id UUID,
    FOREIGN KEY (university_id) REFERENCES university (id)
);