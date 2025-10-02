-- =====================================================
-- MapEstate Real Estate Platform Database
-- MySQL Database Structure
-- Date: 2025-01-18
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create database
CREATE DATABASE IF NOT EXISTS mapestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mapestate;

-- =====================================================
-- TABLE: users
-- =====================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(191) NOT NULL,
  `email` varchar(320) NOT NULL,
  `password` text NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` text DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `wave_balance` int(11) DEFAULT 10,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_expired` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: user_languages
-- =====================================================
DROP TABLE IF EXISTS `user_languages`;
CREATE TABLE `user_languages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `language` varchar(3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_language` (`user_id`, `language`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_user_languages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: waves
-- =====================================================
DROP TABLE IF EXISTS `waves`;
CREATE TABLE `waves` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3B82F6',
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `fk_waves_created_by` (`created_by`),
  CONSTRAINT `fk_waves_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: properties
-- =====================================================
DROP TABLE IF EXISTS `properties`;
CREATE TABLE `properties` (
  `id` varchar(36) NOT NULL,
  `title` text NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `listing_type` varchar(20) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `bedrooms` int(11) DEFAULT NULL,
  `bathrooms` int(11) DEFAULT NULL,
  `area` int(11) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` varchar(16) DEFAULT 'active',
  `language` varchar(3) NOT NULL DEFAULT 'en',
  `agent_id` varchar(36) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `wave_id` varchar(36) DEFAULT NULL,
  `views` int(11) DEFAULT 0,
  `is_featured` tinyint(1) DEFAULT 0,
  `slug` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_type` (`type`),
  KEY `idx_listing_type` (`listing_type`),
  KEY `idx_city` (`city`),
  KEY `idx_status` (`status`),
  KEY `idx_language` (`language`),
  KEY `idx_is_featured` (`is_featured`),
  KEY `fk_properties_agent` (`agent_id`),
  KEY `fk_properties_wave` (`wave_id`),
  CONSTRAINT `fk_properties_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_properties_wave` FOREIGN KEY (`wave_id`) REFERENCES `waves` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: property_images
-- =====================================================
DROP TABLE IF EXISTS `property_images`;
CREATE TABLE `property_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` varchar(36) NOT NULL,
  `image_url` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `alt_text` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_property_id` (`property_id`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `fk_property_images_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: property_amenities
-- =====================================================
DROP TABLE IF EXISTS `property_amenities`;
CREATE TABLE `property_amenities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` varchar(36) NOT NULL,
  `amenity` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_amenity` (`property_id`, `amenity`),
  KEY `idx_property_id` (`property_id`),
  CONSTRAINT `fk_property_amenities_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: property_features
-- =====================================================
DROP TABLE IF EXISTS `property_features`;
CREATE TABLE `property_features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` varchar(36) NOT NULL,
  `feature` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_feature` (`property_id`, `feature`),
  KEY `idx_property_id` (`property_id`),
  CONSTRAINT `fk_property_features_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: inquiries
-- =====================================================
DROP TABLE IF EXISTS `inquiries`;
CREATE TABLE `inquiries` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `message` text NOT NULL,
  `status` varchar(16) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `fk_inquiries_property` (`property_id`),
  KEY `fk_inquiries_user` (`user_id`),
  CONSTRAINT `fk_inquiries_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  CONSTRAINT `fk_inquiries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: favorites
-- =====================================================
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_property_favorite` (`user_id`, `property_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `fk_favorites_property` (`property_id`),
  CONSTRAINT `fk_favorites_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: search_history
-- =====================================================
DROP TABLE IF EXISTS `search_history`;
CREATE TABLE `search_history` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `query` text NOT NULL,
  `results` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_search_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: search_filters
-- =====================================================
DROP TABLE IF EXISTS `search_filters`;
CREATE TABLE `search_filters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `search_id` varchar(36) NOT NULL,
  `filter_key` varchar(50) NOT NULL,
  `filter_value` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_search_id` (`search_id`),
  CONSTRAINT `fk_search_filters_search` FOREIGN KEY (`search_id`) REFERENCES `search_history` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: customer_activity
-- =====================================================
DROP TABLE IF EXISTS `customer_activity`;
CREATE TABLE `customer_activity` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `fk_customer_activity_property` (`property_id`),
  CONSTRAINT `fk_customer_activity_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  CONSTRAINT `fk_customer_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: activity_metadata
-- =====================================================
DROP TABLE IF EXISTS `activity_metadata`;
CREATE TABLE `activity_metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` varchar(36) NOT NULL,
  `metadata_key` varchar(50) NOT NULL,
  `metadata_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_id` (`activity_id`),
  CONSTRAINT `fk_activity_metadata_activity` FOREIGN KEY (`activity_id`) REFERENCES `customer_activity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: customer_points
-- =====================================================
DROP TABLE IF EXISTS `customer_points`;
CREATE TABLE `customer_points` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `total_points` int(11) DEFAULT 0,
  `current_level` varchar(20) DEFAULT 'Bronze',
  `points_this_month` int(11) DEFAULT 0,
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_customer_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: currency_rates
-- =====================================================
DROP TABLE IF EXISTS `currency_rates`;
CREATE TABLE `currency_rates` (
  `id` varchar(36) NOT NULL,
  `from_currency` varchar(3) NOT NULL DEFAULT 'USD',
  `to_currency` varchar(3) NOT NULL,
  `rate` decimal(12,6) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `set_by` varchar(36) DEFAULT NULL,
  `effective_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_currencies` (`from_currency`, `to_currency`),
  KEY `idx_is_active` (`is_active`),
  KEY `fk_currency_rates_set_by` (`set_by`),
  CONSTRAINT `fk_currency_rates_set_by` FOREIGN KEY (`set_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: client_locations
-- =====================================================
DROP TABLE IF EXISTS `client_locations`;
CREATE TABLE `client_locations` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `accuracy` int(11) DEFAULT NULL,
  `source` varchar(32) DEFAULT 'map_button',
  `user_agent` text DEFAULT NULL,
  `language` varchar(10) DEFAULT NULL,
  `permission_status` varchar(20) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_client_locations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLE: customer_wave_permissions
-- =====================================================
DROP TABLE IF EXISTS `customer_wave_permissions`;
CREATE TABLE `customer_wave_permissions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `wave_id` varchar(36) NOT NULL,
  `max_properties` int(11) NOT NULL DEFAULT 1,
  `used_properties` int(11) DEFAULT 0,
  `granted_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_wave_id` (`wave_id`),
  KEY `fk_customer_wave_permissions_granted_by` (`granted_by`),
  CONSTRAINT `fk_customer_wave_permissions_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_customer_wave_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_customer_wave_permissions_wave` FOREIGN KEY (`wave_id`) REFERENCES `waves` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin user (password: admin123)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `first_name`, `last_name`, `is_verified`, `wave_balance`, `is_expired`, `created_at`) VALUES
('admin-001', 'admin', 'admin@mapestate.com', '$2a$10$YourHashedPasswordHere', 'admin', 'Admin', 'User', 1, 999999, 0, NOW());

-- Insert default waves
INSERT INTO `waves` (`id`, `name`, `description`, `color`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
('wave-001', 'Premium Wave', 'Premium tier with unlimited properties', '#FFD700', 1, 'admin-001', NOW(), NOW()),
('wave-002', 'Standard Wave', 'Standard tier with 10 properties', '#3B82F6', 1, 'admin-001', NOW(), NOW()),
('wave-003', 'Basic Wave', 'Basic tier with 3 properties', '#10B981', 1, 'admin-001', NOW(), NOW());

-- Insert default currency rates
INSERT INTO `currency_rates` (`id`, `from_currency`, `to_currency`, `rate`, `is_active`, `set_by`, `effective_date`, `created_at`, `updated_at`) VALUES
('rate-001', 'USD', 'EUR', 0.920000, 1, 'admin-001', NOW(), NOW(), NOW()),
('rate-002', 'USD', 'GBP', 0.790000, 1, 'admin-001', NOW(), NOW(), NOW()),
('rate-003', 'USD', 'IQD', 1310.000000, 1, 'admin-001', NOW(), NOW(), NOW()),
('rate-004', 'EUR', 'USD', 1.087000, 1, 'admin-001', NOW(), NOW(), NOW()),
('rate-005', 'GBP', 'USD', 1.266000, 1, 'admin-001', NOW(), NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- DATABASE CREATION COMPLETE
-- =====================================================

SELECT 'MapEstate database created successfully!' AS Status;
SELECT COUNT(*) AS TotalTables FROM information_schema.tables WHERE table_schema = 'mapestate';
