CREATE TABLE IF NOT EXISTS university (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    repo_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS thesis (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    abstract TEXT,
    year INT,
    url TEXT NOT NULL,
    university_id INT REFERENCES university(id)
);