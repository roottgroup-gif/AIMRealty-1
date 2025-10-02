-- Create Database and User for MapEstate on VPS
-- Run this on your VPS MySQL as root user

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS mapestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if it doesn't exist
CREATE USER IF NOT EXISTS 'mapestate'@'localhost' IDENTIFIED BY 'mapestate_secure_password_2024';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON mapestate.* TO 'mapestate'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Switch to the database
USE mapestate;

-- Show confirmation
SELECT 'Database and user created successfully!' AS Status;
SELECT DATABASE() AS CurrentDatabase;
