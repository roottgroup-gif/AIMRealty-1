-- MySQL Import Script for Real Estate Application (MapEstate)
-- Generated from Drizzle schema
-- Run this script in your MySQL database to create all required tables

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';

-- Create database if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS `mapestate` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `mapestate`;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `user_languages`
-- --------------------------------------------------------

CREATE TABLE `user_languages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `language` varchar(3) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_language` (`user_id`, `language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `waves`
-- --------------------------------------------------------

CREATE TABLE `waves` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3B82F6',
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `properties`
-- --------------------------------------------------------

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
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `property_images`
-- --------------------------------------------------------

CREATE TABLE `property_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` varchar(36) NOT NULL,
  `image_url` text NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `alt_text` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `property_amenities`
-- --------------------------------------------------------

CREATE TABLE `property_amenities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` varchar(36) NOT NULL,
  `amenity` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_amenity` (`property_id`, `amenity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `property_features`
-- --------------------------------------------------------

CREATE TABLE `property_features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `property_id` varchar(36) NOT NULL,
  `feature` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_property_feature` (`property_id`, `feature`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `inquiries`
-- --------------------------------------------------------

CREATE TABLE `inquiries` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `message` text NOT NULL,
  `status` varchar(16) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `favorites`
-- --------------------------------------------------------

CREATE TABLE `favorites` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user_property_favorite` (`user_id`, `property_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `search_history`
-- --------------------------------------------------------

CREATE TABLE `search_history` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `query` text NOT NULL,
  `results` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `search_filters`
-- --------------------------------------------------------

CREATE TABLE `search_filters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `search_id` varchar(36) NOT NULL,
  `filter_key` varchar(50) NOT NULL,
  `filter_value` varchar(200) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `customer_activity`
-- --------------------------------------------------------

CREATE TABLE `customer_activity` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `property_id` varchar(36) DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `activity_metadata`
-- --------------------------------------------------------

CREATE TABLE `activity_metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `activity_id` varchar(36) NOT NULL,
  `metadata_key` varchar(50) NOT NULL,
  `metadata_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `customer_points`
-- --------------------------------------------------------

CREATE TABLE `customer_points` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `total_points` int(11) DEFAULT 0,
  `current_level` varchar(20) DEFAULT 'Bronze',
  `points_this_month` int(11) DEFAULT 0,
  `last_activity` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `currency_rates`
-- --------------------------------------------------------

CREATE TABLE `currency_rates` (
  `id` varchar(36) NOT NULL,
  `from_currency` varchar(3) NOT NULL DEFAULT 'USD',
  `to_currency` varchar(3) NOT NULL,
  `rate` decimal(12,6) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `set_by` varchar(36) DEFAULT NULL,
  `effective_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `client_locations`
-- --------------------------------------------------------

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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `customer_wave_permissions`
-- --------------------------------------------------------

CREATE TABLE `customer_wave_permissions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `wave_id` varchar(36) NOT NULL,
  `max_properties` int(11) NOT NULL DEFAULT 1,
  `used_properties` int(11) DEFAULT 0,
  `granted_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- PRIMARY KEYS
-- --------------------------------------------------------

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `waves`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `search_history`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `customer_activity`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `customer_points`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

ALTER TABLE `currency_rates`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `client_locations`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `customer_wave_permissions`
  ADD PRIMARY KEY (`id`);

-- --------------------------------------------------------
-- INDEXES for better performance
-- --------------------------------------------------------

-- Users table indexes
ALTER TABLE `users`
  ADD INDEX `idx_users_role` (`role`),
  ADD INDEX `idx_users_created_at` (`created_at`);

-- Properties table indexes
ALTER TABLE `properties`
  ADD INDEX `idx_properties_city` (`city`),
  ADD INDEX `idx_properties_country` (`country`),
  ADD INDEX `idx_properties_type` (`type`),
  ADD INDEX `idx_properties_listing_type` (`listing_type`),
  ADD INDEX `idx_properties_status` (`status`),
  ADD INDEX `idx_properties_language` (`language`),
  ADD INDEX `idx_properties_price` (`price`),
  ADD INDEX `idx_properties_agent_id` (`agent_id`),
  ADD INDEX `idx_properties_wave_id` (`wave_id`),
  ADD INDEX `idx_properties_is_featured` (`is_featured`),
  ADD INDEX `idx_properties_created_at` (`created_at`),
  ADD INDEX `idx_properties_location` (`latitude`, `longitude`);

-- Property images indexes
ALTER TABLE `property_images`
  ADD INDEX `idx_property_images_property_id` (`property_id`),
  ADD INDEX `idx_property_images_sort_order` (`sort_order`);

-- Property amenities indexes
ALTER TABLE `property_amenities`
  ADD INDEX `idx_property_amenities_property_id` (`property_id`),
  ADD INDEX `idx_property_amenities_amenity` (`amenity`);

-- Property features indexes
ALTER TABLE `property_features`
  ADD INDEX `idx_property_features_property_id` (`property_id`),
  ADD INDEX `idx_property_features_feature` (`feature`);

-- Inquiries table indexes
ALTER TABLE `inquiries`
  ADD INDEX `idx_inquiries_property_id` (`property_id`),
  ADD INDEX `idx_inquiries_user_id` (`user_id`),
  ADD INDEX `idx_inquiries_status` (`status`),
  ADD INDEX `idx_inquiries_created_at` (`created_at`);

-- Favorites table indexes
ALTER TABLE `favorites`
  ADD INDEX `idx_favorites_user_id` (`user_id`),
  ADD INDEX `idx_favorites_property_id` (`property_id`);

-- Search history indexes
ALTER TABLE `search_history`
  ADD INDEX `idx_search_history_user_id` (`user_id`),
  ADD INDEX `idx_search_history_created_at` (`created_at`);

-- Search filters indexes
ALTER TABLE `search_filters`
  ADD INDEX `idx_search_filters_search_id` (`search_id`),
  ADD INDEX `idx_search_filters_key` (`filter_key`);

-- Customer activity indexes
ALTER TABLE `customer_activity`
  ADD INDEX `idx_customer_activity_user_id` (`user_id`),
  ADD INDEX `idx_customer_activity_property_id` (`property_id`),
  ADD INDEX `idx_customer_activity_type` (`activity_type`),
  ADD INDEX `idx_customer_activity_created_at` (`created_at`);

-- Activity metadata indexes
ALTER TABLE `activity_metadata`
  ADD INDEX `idx_activity_metadata_activity_id` (`activity_id`),
  ADD INDEX `idx_activity_metadata_key` (`metadata_key`);

-- Customer points indexes
ALTER TABLE `customer_points`
  ADD INDEX `idx_customer_points_level` (`current_level`),
  ADD INDEX `idx_customer_points_total` (`total_points`);

-- Currency rates indexes
ALTER TABLE `currency_rates`
  ADD INDEX `idx_currency_rates_from_to` (`from_currency`, `to_currency`),
  ADD INDEX `idx_currency_rates_active` (`is_active`),
  ADD INDEX `idx_currency_rates_effective_date` (`effective_date`);

-- Client locations indexes
ALTER TABLE `client_locations`
  ADD INDEX `idx_client_locations_user_id` (`user_id`),
  ADD INDEX `idx_client_locations_created_at` (`created_at`),
  ADD INDEX `idx_client_locations_coords` (`latitude`, `longitude`);

-- Customer wave permissions indexes
ALTER TABLE `customer_wave_permissions`
  ADD INDEX `idx_wave_permissions_user_id` (`user_id`),
  ADD INDEX `idx_wave_permissions_wave_id` (`wave_id`);

-- User languages indexes
ALTER TABLE `user_languages`
  ADD INDEX `idx_user_languages_user_id` (`user_id`),
  ADD INDEX `idx_user_languages_language` (`language`);

-- Waves indexes
ALTER TABLE `waves`
  ADD INDEX `idx_waves_active` (`is_active`),
  ADD INDEX `idx_waves_created_by` (`created_by`);

-- --------------------------------------------------------
-- FOREIGN KEY CONSTRAINTS
-- --------------------------------------------------------

-- User languages foreign keys
ALTER TABLE `user_languages`
  ADD CONSTRAINT `fk_user_languages_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Waves foreign keys
ALTER TABLE `waves`
  ADD CONSTRAINT `fk_waves_created_by` 
  FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Properties foreign keys
ALTER TABLE `properties`
  ADD CONSTRAINT `fk_properties_agent_id` 
  FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_properties_wave_id` 
  FOREIGN KEY (`wave_id`) REFERENCES `waves` (`id`) ON DELETE SET NULL;

-- Property images foreign keys
ALTER TABLE `property_images`
  ADD CONSTRAINT `fk_property_images_property_id` 
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

-- Property amenities foreign keys
ALTER TABLE `property_amenities`
  ADD CONSTRAINT `fk_property_amenities_property_id` 
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

-- Property features foreign keys
ALTER TABLE `property_features`
  ADD CONSTRAINT `fk_property_features_property_id` 
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

-- Inquiries foreign keys
ALTER TABLE `inquiries`
  ADD CONSTRAINT `fk_inquiries_property_id` 
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_inquiries_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Favorites foreign keys
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_favorites_property_id` 
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

-- Search history foreign keys
ALTER TABLE `search_history`
  ADD CONSTRAINT `fk_search_history_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Search filters foreign keys
ALTER TABLE `search_filters`
  ADD CONSTRAINT `fk_search_filters_search_id` 
  FOREIGN KEY (`search_id`) REFERENCES `search_history` (`id`) ON DELETE CASCADE;

-- Customer activity foreign keys
ALTER TABLE `customer_activity`
  ADD CONSTRAINT `fk_customer_activity_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_customer_activity_property_id` 
  FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE SET NULL;

-- Activity metadata foreign keys
ALTER TABLE `activity_metadata`
  ADD CONSTRAINT `fk_activity_metadata_activity_id` 
  FOREIGN KEY (`activity_id`) REFERENCES `customer_activity` (`id`) ON DELETE CASCADE;

-- Customer points foreign keys
ALTER TABLE `customer_points`
  ADD CONSTRAINT `fk_customer_points_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- Currency rates foreign keys
ALTER TABLE `currency_rates`
  ADD CONSTRAINT `fk_currency_rates_set_by` 
  FOREIGN KEY (`set_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Client locations foreign keys
ALTER TABLE `client_locations`
  ADD CONSTRAINT `fk_client_locations_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Customer wave permissions foreign keys
ALTER TABLE `customer_wave_permissions`
  ADD CONSTRAINT `fk_wave_permissions_user_id` 
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wave_permissions_wave_id` 
  FOREIGN KEY (`wave_id`) REFERENCES `waves` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_wave_permissions_granted_by` 
  FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------
-- Sample Data (Optional - Remove if not needed)
-- --------------------------------------------------------

-- Insert default admin user (password: admin123)
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `first_name`, `last_name`, `is_verified`, `wave_balance`) VALUES
('admin-uuid-1234567890', 'admin', 'admin@mapestate.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System', 'Administrator', 1, 100);

-- Insert default wave
INSERT INTO `waves` (`id`, `name`, `description`, `color`, `is_active`, `created_by`) VALUES
('wave-default-12345', 'Default Wave', 'Default wave for all users', '#3B82F6', 1, 'admin-uuid-1234567890');

-- Insert default currency rates
INSERT INTO `currency_rates` (`id`, `from_currency`, `to_currency`, `rate`, `is_active`, `set_by`) VALUES
('rate-usd-eur-1', 'USD', 'EUR', 0.850000, 1, 'admin-uuid-1234567890'),
('rate-usd-iqd-1', 'USD', 'IQD', 1310.000000, 1, 'admin-uuid-1234567890'),
('rate-usd-try-1', 'USD', 'TRY', 27.500000, 1, 'admin-uuid-1234567890');

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- END OF IMPORT SCRIPT
-- --------------------------------------------------------

-- USAGE INSTRUCTIONS:
-- 1. Create your MySQL database first
-- 2. Update the database name in the CREATE DATABASE line (currently commented)
-- 3. Import this file: mysql -u username -p database_name < mysql_import.sql
-- 4. The script includes sample data (admin user, default wave, currency rates)
-- 5. Remove the sample data section if you don't need it
-- 6. Make sure to update the admin password hash if you keep the sample data