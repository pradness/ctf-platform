CREATE DATABASE ctf;
USE ctf;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100),
    password VARCHAR(100),
    secret VARCHAR(200)
);

INSERT INTO users (username, password, secret) VALUES
('admin', 'adminpass', 'welcome'),
('user', 'userpass', 'dummy');
