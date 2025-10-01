-- MapEstate Database Schema for MySQL
-- Run this on your VPS: mysql -u mapestate -p mapestate < setup-mysql-tables.sql

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL UNIQUE,
  `email` VARCHAR(320) NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  `first_name` VARCHAR(100),
  `last_name` VARCHAR(100),
  `phone` VARCHAR(20),
  `avatar` TEXT,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `wave_balance` INT DEFAULT 10,
  `expires_at` TIMESTAMP NULL,
  `is_expired` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User languages table
CREATE TABLE IF NOT EXISTS `user_languages` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` VARCHAR(36) NOT NULL,
  `language` VARCHAR(3) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_language` (`user_id`, `language`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Waves table
CREATE TABLE IF NOT EXISTS `waves` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `color` VARCHAR(7) DEFAULT '#3B82F6',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`)
);

-- Properties table
CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` TEXT NOT NULL,
  `description` TEXT,
  `type` VARCHAR(50) NOT NULL,
  `listing_type` VARCHAR(20) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'USD',
  `bedrooms` INT,
  `bathrooms` INT,
  `area` INT,
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `country` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10, 8),
  `longitude` DECIMAL(11, 8),
  `status` VARCHAR(16) DEFAULT 'active',
  `language` VARCHAR(3) NOT NULL DEFAULT 'en',
  `agent_id` VARCHAR(36),
  `contact_phone` VARCHAR(20),
  `wave_id` VARCHAR(36),
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `slug` VARCHAR(255) UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`wave_id`) REFERENCES `waves`(`id`)
);

-- Property images table
CREATE TABLE IF NOT EXISTS `property_images` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `property_id` VARCHAR(36) NOT NULL,
  `image_url` TEXT NOT NULL,
  `sort_order` INT DEFAULT 0,
  `alt_text` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
);

-- Property amenities table
CREATE TABLE IF NOT EXISTS `property_amenities` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `property_id` VARCHAR(36) NOT NULL,
  `amenity` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_property_amenity` (`property_id`, `amenity`),
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
);

-- Property features table
CREATE TABLE IF NOT EXISTS `property_features` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `property_id` VARCHAR(36) NOT NULL,
  `feature` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_property_feature` (`property_id`, `feature`),
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(36) PRIMARY KEY,
  `property_id` VARCHAR(36),
  `user_id` VARCHAR(36),
  `name` VARCHAR(200) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `phone` VARCHAR(20),
  `message` TEXT NOT NULL,
  `status` VARCHAR(16) DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `property_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_property_favorite` (`user_id`, `property_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE
);

-- Search history table
CREATE TABLE IF NOT EXISTS `search_history` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `query` TEXT NOT NULL,
  `results` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Search filters table
CREATE TABLE IF NOT EXISTS `search_filters` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `search_id` VARCHAR(36) NOT NULL,
  `filter_key` VARCHAR(50) NOT NULL,
  `filter_value` VARCHAR(200) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`search_id`) REFERENCES `search_history`(`id`) ON DELETE CASCADE
);

-- Customer activity table
CREATE TABLE IF NOT EXISTS `customer_activity` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `activity_type` VARCHAR(50) NOT NULL,
  `property_id` VARCHAR(36),
  `points` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`)
);

-- Activity metadata table
CREATE TABLE IF NOT EXISTS `activity_metadata` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `activity_id` VARCHAR(36) NOT NULL,
  `metadata_key` VARCHAR(50) NOT NULL,
  `metadata_value` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`activity_id`) REFERENCES `customer_activity`(`id`) ON DELETE CASCADE
);

-- Customer points table
CREATE TABLE IF NOT EXISTS `customer_points` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `total_points` INT DEFAULT 0,
  `current_level` VARCHAR(20) DEFAULT 'Bronze',
  `points_this_month` INT DEFAULT 0,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Currency rates table
CREATE TABLE IF NOT EXISTS `currency_rates` (
  `id` VARCHAR(36) PRIMARY KEY,
  `from_currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `to_currency` VARCHAR(3) NOT NULL,
  `rate` DECIMAL(12, 6) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `set_by` VARCHAR(36),
  `effective_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`set_by`) REFERENCES `users`(`id`)
);

-- Client locations table
CREATE TABLE IF NOT EXISTS `client_locations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `accuracy` INT,
  `source` VARCHAR(32) DEFAULT 'map_button',
  `user_agent` TEXT,
  `language` VARCHAR(10),
  `permission_status` VARCHAR(20),
  `city` VARCHAR(100),
  `country` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Customer wave permissions table
CREATE TABLE IF NOT EXISTS `customer_wave_permissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `wave_id` VARCHAR(36) NOT NULL,
  `max_properties` INT NOT NULL DEFAULT 1,
  `used_properties` INT DEFAULT 0,
  `granted_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`wave_id`) REFERENCES `waves`(`id`),
  FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`)
);

-- Success message
SELECT 'All tables created successfully!' AS status;
