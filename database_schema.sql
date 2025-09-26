-- MapEstate Database Schema for MySQL
-- Multi-language Real Estate Platform
-- Generated from shared/schema.ts

SET FOREIGN_KEY_CHECKS = 0;

-- Create database (if running manually)
-- CREATE DATABASE IF NOT EXISTS mapestate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE mapestate_db;

-- ===========================================
-- CORE TABLES
-- ===========================================

-- Users table with multi-language support
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `username` VARCHAR(191) NOT NULL UNIQUE,
  `email` VARCHAR(320) NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user',
  `first_name` TEXT,
  `last_name` TEXT,
  `phone` TEXT,
  `avatar` TEXT,
  `is_verified` BOOLEAN DEFAULT false,
  `wave_balance` INT DEFAULT 10,
  `expires_at` TIMESTAMP NULL,
  `is_expired` BOOLEAN DEFAULT false,
  `allowed_languages` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Waves table for property organization
CREATE TABLE IF NOT EXISTS `waves` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` TEXT NOT NULL,
  `description` TEXT,
  `color` VARCHAR(7) DEFAULT '#3B82F6',
  `is_active` BOOLEAN DEFAULT true,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_active` (`is_active`),
  INDEX `idx_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Properties table with comprehensive real estate data
CREATE TABLE IF NOT EXISTS `properties` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` TEXT NOT NULL,
  `description` TEXT,
  `type` TEXT NOT NULL,
  `listing_type` TEXT NOT NULL,
  `price` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'USD',
  `bedrooms` INT,
  `bathrooms` INT,
  `area` INT,
  `address` TEXT NOT NULL,
  `city` TEXT NOT NULL,
  `country` TEXT NOT NULL,
  `latitude` DECIMAL(10,8),
  `longitude` DECIMAL(11,8),
  `images` JSON,
  `amenities` JSON,
  `features` JSON,
  `status` VARCHAR(16) DEFAULT 'active',
  `language` VARCHAR(3) NOT NULL DEFAULT 'en',
  `agent_id` VARCHAR(36),
  `contact_phone` TEXT,
  `wave_id` VARCHAR(36),
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT false,
  `slug` VARCHAR(255) UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`wave_id`) REFERENCES `waves`(`id`) ON DELETE SET NULL,
  INDEX `idx_type_listing` (`type`, `listing_type`),
  INDEX `idx_price` (`price`),
  INDEX `idx_city_country` (`city`, `country`),
  INDEX `idx_status` (`status`),
  INDEX `idx_language` (`language`),
  INDEX `idx_agent` (`agent_id`),
  INDEX `idx_wave` (`wave_id`),
  INDEX `idx_featured` (`is_featured`),
  INDEX `idx_slug` (`slug`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer inquiries
CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` VARCHAR(36) PRIMARY KEY,
  `property_id` VARCHAR(36),
  `user_id` VARCHAR(36),
  `name` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `phone` TEXT,
  `message` TEXT NOT NULL,
  `status` VARCHAR(16) DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_property` (`property_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User favorites
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `property_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_property` (`user_id`, `property_id`),
  INDEX `idx_user` (`user_id`),
  INDEX `idx_property` (`property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- ANALYTICS & TRACKING TABLES
-- ===========================================

-- Search history for analytics
CREATE TABLE IF NOT EXISTS `search_history` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `query` TEXT NOT NULL,
  `filters` JSON,
  `results` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer activity tracking
CREATE TABLE IF NOT EXISTS `customer_activity` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `activity_type` TEXT NOT NULL,
  `property_id` VARCHAR(36),
  `metadata` JSON,
  `points` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_activity_type` (`activity_type`(100)),
  INDEX `idx_property` (`property_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer points system
CREATE TABLE IF NOT EXISTS `customer_points` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `total_points` INT DEFAULT 0,
  `current_level` VARCHAR(20) DEFAULT 'Bronze',
  `points_this_month` INT DEFAULT 0,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_level` (`current_level`),
  INDEX `idx_total_points` (`total_points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- AI & RECOMMENDATION TABLES
-- ===========================================

-- User preferences for AI recommendations
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `preferred_property_types` JSON,
  `preferred_listing_types` JSON,
  `budget_range` JSON,
  `preferred_locations` JSON,
  `preferred_bedrooms` JSON,
  `preferred_amenities` JSON,
  `viewing_history` JSON,
  `interaction_scores` JSON,
  `last_recommendation_update` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI-generated recommendations
CREATE TABLE IF NOT EXISTS `user_recommendations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NOT NULL,
  `recommendation_type` TEXT NOT NULL,
  `confidence` DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  `reasoning` JSON,
  `is_viewed` BOOLEAN DEFAULT false,
  `is_clicked` BOOLEAN DEFAULT false,
  `is_favorited` BOOLEAN DEFAULT false,
  `feedback_score` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_property` (`property_id`),
  INDEX `idx_type` (`recommendation_type`(100)),
  INDEX `idx_confidence` (`confidence`),
  INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property similarity matrix
CREATE TABLE IF NOT EXISTS `property_similarity` (
  `id` VARCHAR(36) PRIMARY KEY,
  `property_id_1` VARCHAR(36) NOT NULL,
  `property_id_2` VARCHAR(36) NOT NULL,
  `similarity_score` DECIMAL(3,2) NOT NULL,
  `similarity_factors` JSON,
  `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`property_id_1`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id_2`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  INDEX `idx_prop1` (`property_id_1`),
  INDEX `idx_prop2` (`property_id_2`),
  INDEX `idx_score` (`similarity_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendation analytics
CREATE TABLE IF NOT EXISTS `recommendation_analytics` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `recommendation_type` TEXT NOT NULL,
  `total_generated` INT DEFAULT 0,
  `total_viewed` INT DEFAULT 0,
  `total_clicked` INT DEFAULT 0,
  `total_favorited` INT DEFAULT 0,
  `click_through_rate` DECIMAL(3,2) DEFAULT 0.00,
  `conversion_rate` DECIMAL(3,2) DEFAULT 0.00,
  `avg_confidence_score` DECIMAL(3,2) DEFAULT 0.50,
  `period` TEXT NOT NULL,
  `date` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_type` (`recommendation_type`(100)),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- BUSINESS MANAGEMENT TABLES
-- ===========================================

-- Currency exchange rates
CREATE TABLE IF NOT EXISTS `currency_rates` (
  `id` VARCHAR(36) PRIMARY KEY,
  `from_currency` VARCHAR(3) NOT NULL DEFAULT 'USD',
  `to_currency` TEXT NOT NULL,
  `rate` DECIMAL(12,6) NOT NULL,
  `is_active` BOOLEAN DEFAULT true,
  `set_by` VARCHAR(36),
  `effective_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`set_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_currencies` (`from_currency`, `to_currency`(10)),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_effective` (`effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer wave permissions
CREATE TABLE IF NOT EXISTS `customer_wave_permissions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `wave_id` VARCHAR(36) NOT NULL,
  `max_properties` INT NOT NULL DEFAULT 1,
  `used_properties` INT DEFAULT 0,
  `granted_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`wave_id`) REFERENCES `waves`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_wave` (`wave_id`),
  INDEX `idx_granted_by` (`granted_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client location tracking
CREATE TABLE IF NOT EXISTS `client_locations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `accuracy` INT,
  `source` VARCHAR(32) DEFAULT 'map_button',
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_location` (`latitude`, `longitude`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================
-- SAMPLE DATA
-- ===========================================

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO `users` VALUES 
('admin-001', 'admin', 'admin@estateai.com', '$2b$12$rQJ9fZKMnQ8p7.L5xJ8qC.6zOp4K2LZzR3J8q5K2p7.L5xJ8qC.6zO', 'super_admin', 'System', 'Admin', '+964 750 000 0000', NULL, true, 999999, NULL, false, '["en", "ar", "kur"]', NOW());

-- Insert default customer user (password: customer123)
INSERT IGNORE INTO `users` VALUES 
('customer-001', 'Jutyar', 'jutyar@estateai.com', '$2b$12$rQJ9fZKMnQ8p7.L5xJ8qC.6zOp4K2LZzR3J8q5K2p7.L5xJ8qC.6zO', 'user', 'Jutyar', 'Customer', '+964 750 111 2222', NULL, true, 10, NULL, false, '["en"]', NOW());

-- Insert default waves
INSERT IGNORE INTO `waves` VALUES 
('wave-001', 'Premium Wave', 'Premium properties with special circle motion effect', '#F59E0B', true, 'admin-001', NOW(), NOW()),
('wave-002', 'Luxury Homes', 'High-end luxury properties', '#9333EA', true, 'admin-001', NOW(), NOW()),
('wave-003', 'Budget Friendly', 'Affordable housing options', '#059669', true, 'admin-001', NOW(), NOW());

-- Insert default currency rates
INSERT IGNORE INTO `currency_rates` VALUES 
('rate-001', 'USD', 'IQD', 1310.000000, true, 'admin-001', NOW(), NOW(), NOW()),
('rate-002', 'USD', 'EUR', 0.850000, true, 'admin-001', NOW(), NOW(), NOW()),
('rate-003', 'USD', 'AED', 3.670000, true, 'admin-001', NOW(), NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================
-- NOTES
-- ===========================================

/*
Database Features:
- Multi-language support (English, Arabic, Kurdish)
- Advanced property search and filtering
- User role system (user, admin, super_admin)
- Wave-based property organization
- Real-time currency conversion
- AI-powered recommendations
- Comprehensive analytics
- Location tracking
- Points and gamification system

Key Indexes:
- Optimized for property searches by type, price, location
- Fast user lookup by username/email
- Efficient wave and permission queries
- Analytics and recommendation performance

Security:
- Foreign key constraints for data integrity
- Proper indexing for performance
- UTF8MB4 charset for full Unicode support
- Prepared for horizontal scaling
*/