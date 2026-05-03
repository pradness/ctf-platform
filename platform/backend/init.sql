-- PostgreSQL database initialization for CTF Platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(50),
    url VARCHAR(255),
    flag VARCHAR(500),
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User flags table (for tracking dynamic flags per user)
CREATE TABLE IF NOT EXISTS user_flags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    flag VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

-- Submissions table (for tracking flag submissions)
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    flag VARCHAR(255),
    points INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exact flag submissions table (prevents duplicate flag reuse)
CREATE TABLE IF NOT EXISTS flag_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    submitted_flag VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id, submitted_flag)
);

-- Containers table (for tracking running challenge containers)
CREATE TABLE IF NOT EXISTS containers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    container_id VARCHAR(255) NOT NULL,
    port INTEGER,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample challenges
INSERT INTO challenges (name, description, difficulty, points) VALUES
    ('SQL Injection', 'Find the hidden flag using SQL Injection techniques.', 'easy', 50),
    ('XSS', 'Exploit Cross-Site Scripting vulnerabilities.', 'medium', 75),
    ('Broken Auth', 'Bypass authentication mechanisms.', 'hard', 100)
ON CONFLICT DO NOTHING;

-- Insert sample user (password: admin123)
INSERT INTO users (username, password) VALUES
    ('admin', '$2b$10$slYQmyNdGzin7olVZfJqDOI26g3J8KXHVi9YKM5kI7sVfq0qNXfje')
ON CONFLICT DO NOTHING;
