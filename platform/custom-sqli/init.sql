CREATE DATABASE IF NOT EXISTS ctf;
USE ctf;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(100),
    secret VARCHAR(200)
);

INSERT INTO users (username, password, secret) VALUES
('admin', 'adminpass', 'welcome'),
('user', 'userpass', 'dummy');
