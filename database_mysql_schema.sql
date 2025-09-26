-- MySQL Database Schema for Property Management System
-- Generated for MySQL 8.0+
-- Contains all tables with proper indexes and constraints

-- Create database (optional - uncomment if creating new database)
-- CREATE DATABASE property_management;
-- USE property_management;

-- Set MySQL specific settings
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- Users table
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `username` VARCHAR(191) NOT NULL UNIQUE,
  `email` VARCHAR(320) NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT 'user | admin | super_admin',
  `first_name` TEXT,
  `last_name` TEXT,
  `phone` TEXT,
  `avatar` TEXT,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `wave_balance` INT DEFAULT 10 COMMENT 'Number of waves user can assign to properties',
  `expires_at` TIMESTAMP NULL COMMENT 'User account expiration date',
  `is_expired` BOOLEAN DEFAULT FALSE COMMENT 'Computed or manual flag for expiration status',
  `allowed_languages` JSON COMMENT 'Languages user can add data in: "en", "ar", "ku"',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
);

-- Waves table (must be created before properties due to foreign key)
CREATE TABLE `waves` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `name` TEXT NOT NULL,
  `description` TEXT,
  `color` VARCHAR(7) DEFAULT '#3B82F6' COMMENT 'Hex color for map display',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_waves_created_by` (`created_by`),
  INDEX `idx_waves_active` (`is_active`)
);

-- Properties table
CREATE TABLE `properties` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `title` TEXT NOT NULL,
  `description` TEXT,
  `type` TEXT NOT NULL COMMENT 'house | apartment | villa | land',
  `listing_type` TEXT NOT NULL COMMENT 'sale | rent',
  `price` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'USD',
  `bedrooms` INT,
  `bathrooms` INT,
  `area` INT COMMENT 'in square meters',
  `address` TEXT NOT NULL,
  `city` TEXT NOT NULL,
  `country` TEXT NOT NULL,
  `latitude` DECIMAL(10,8),
  `longitude` DECIMAL(11,8),
  `images` JSON,
  `amenities` JSON,
  `features` JSON,
  `status` VARCHAR(16) DEFAULT 'active' COMMENT 'active | sold | rented | pending',
  `language` VARCHAR(3) NOT NULL DEFAULT 'en' COMMENT 'Language of the property data: en, ar, ku',
  `agent_id` VARCHAR(36),
  `contact_phone` TEXT COMMENT 'Contact phone number for this property (WhatsApp and calls)',
  `wave_id` VARCHAR(36) COMMENT 'Wave assignment',
  `views` INT DEFAULT 0,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `slug` VARCHAR(255) UNIQUE COMMENT 'SEO-friendly URL slug',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`wave_id`) REFERENCES `waves`(`id`) ON DELETE SET NULL,
  INDEX `idx_properties_agent_id` (`agent_id`),
  INDEX `idx_properties_wave_id` (`wave_id`),
  INDEX `idx_properties_type` (`type`(50)),
  INDEX `idx_properties_listing_type` (`listing_type`(10)),
  INDEX `idx_properties_city` (`city`(100)),
  INDEX `idx_properties_country` (`country`(100)),
  INDEX `idx_properties_price` (`price`),
  INDEX `idx_properties_status` (`status`),
  INDEX `idx_properties_featured` (`is_featured`),
  INDEX `idx_properties_created_at` (`created_at`),
  INDEX `idx_properties_slug` (`slug`)
);

-- Inquiries table
CREATE TABLE `inquiries` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `property_id` VARCHAR(36),
  `user_id` VARCHAR(36),
  `name` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `phone` TEXT,
  `message` TEXT NOT NULL,
  `status` VARCHAR(16) DEFAULT 'pending' COMMENT 'pending | replied | closed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_inquiries_property_id` (`property_id`),
  INDEX `idx_inquiries_user_id` (`user_id`),
  INDEX `idx_inquiries_status` (`status`)
);

-- Favorites table
CREATE TABLE `favorites` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36),
  `property_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  INDEX `idx_favorites_user_id` (`user_id`),
  INDEX `idx_favorites_property_id` (`property_id`),
  UNIQUE KEY `unique_favorite` (`user_id`, `property_id`)
);

-- Search history table
CREATE TABLE `search_history` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36),
  `query` TEXT NOT NULL,
  `filters` JSON,
  `results` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_search_history_user_id` (`user_id`),
  INDEX `idx_search_history_created_at` (`created_at`)
);

-- Customer activity table
CREATE TABLE `customer_activity` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `activity_type` TEXT NOT NULL COMMENT 'property_view | search | favorite_add | favorite_remove | inquiry_sent | login | profile_update',
  `property_id` VARCHAR(36),
  `metadata` JSON,
  `points` INT DEFAULT 0 COMMENT 'Points earned for this activity',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE SET NULL,
  INDEX `idx_customer_activity_user_id` (`user_id`),
  INDEX `idx_customer_activity_property_id` (`property_id`),
  INDEX `idx_customer_activity_type` (`activity_type`(50)),
  INDEX `idx_customer_activity_created_at` (`created_at`)
);

-- Customer points table
CREATE TABLE `customer_points` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `total_points` INT DEFAULT 0,
  `current_level` VARCHAR(20) DEFAULT 'Bronze' COMMENT 'Bronze, Silver, Gold, Platinum',
  `points_this_month` INT DEFAULT 0,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_customer_points_user_id` (`user_id`),
  INDEX `idx_customer_points_total` (`total_points`)
);

-- User preferences table
CREATE TABLE `user_preferences` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL UNIQUE,
  `preferred_property_types` JSON COMMENT '["apartment", "house", "villa"]',
  `preferred_listing_types` JSON COMMENT '["sale", "rent"]',
  `budget_range` JSON COMMENT '{"min": number, "max": number, "currency": string}',
  `preferred_locations` JSON COMMENT '["erbil", "baghdad"]',
  `preferred_bedrooms` JSON COMMENT '[2, 3, 4]',
  `preferred_amenities` JSON COMMENT '["parking", "pool"]',
  `viewing_history` JSON COMMENT 'propertyId -> view_count',
  `interaction_scores` JSON COMMENT 'propertyId -> score',
  `last_recommendation_update` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_preferences_user_id` (`user_id`)
);

-- User recommendations table
CREATE TABLE `user_recommendations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `property_id` VARCHAR(36) NOT NULL,
  `recommendation_type` TEXT NOT NULL COMMENT 'personalized, similar, trending, location_based',
  `confidence` DECIMAL(3,2) NOT NULL DEFAULT 0.50 COMMENT '0.0 - 1.0',
  `reasoning` JSON COMMENT '["matches_price_range", "similar_to_favorites"]',
  `is_viewed` BOOLEAN DEFAULT FALSE,
  `is_clicked` BOOLEAN DEFAULT FALSE,
  `is_favorited` BOOLEAN DEFAULT FALSE,
  `feedback_score` INT COMMENT 'User feedback: -1 (negative), 0 (neutral), 1 (positive)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP DEFAULT (NOW() + INTERVAL 7 DAY),
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_recommendations_user_id` (`user_id`),
  INDEX `idx_user_recommendations_property_id` (`property_id`),
  INDEX `idx_user_recommendations_type` (`recommendation_type`(50)),
  INDEX `idx_user_recommendations_expires_at` (`expires_at`)
);

-- Property similarity table
CREATE TABLE `property_similarity` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `property_id_1` VARCHAR(36) NOT NULL,
  `property_id_2` VARCHAR(36) NOT NULL,
  `similarity_score` DECIMAL(3,2) NOT NULL COMMENT '0.0 - 1.0',
  `similarity_factors` JSON COMMENT '{"price": 0.8, "location": 0.9}',
  `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`property_id_1`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`property_id_2`) REFERENCES `properties`(`id`) ON DELETE CASCADE,
  INDEX `idx_property_similarity_property_1` (`property_id_1`),
  INDEX `idx_property_similarity_property_2` (`property_id_2`),
  INDEX `idx_property_similarity_score` (`similarity_score`)
);

-- Recommendation analytics table
CREATE TABLE `recommendation_analytics` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36),
  `recommendation_type` TEXT NOT NULL,
  `total_generated` INT DEFAULT 0,
  `total_viewed` INT DEFAULT 0,
  `total_clicked` INT DEFAULT 0,
  `total_favorited` INT DEFAULT 0,
  `click_through_rate` DECIMAL(3,2) DEFAULT 0.00,
  `conversion_rate` DECIMAL(3,2) DEFAULT 0.00,
  `avg_confidence_score` DECIMAL(3,2) DEFAULT 0.50,
  `period` TEXT NOT NULL COMMENT 'daily, weekly, monthly',
  `date` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_recommendation_analytics_user_id` (`user_id`),
  INDEX `idx_recommendation_analytics_type` (`recommendation_type`(50)),
  INDEX `idx_recommendation_analytics_date` (`date`)
);

-- Currency rates table
CREATE TABLE `currency_rates` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `from_currency` VARCHAR(3) NOT NULL DEFAULT 'USD' COMMENT 'Base currency (always USD)',
  `to_currency` TEXT NOT NULL COMMENT 'Target currency (IQD, AED, EUR, etc.)',
  `rate` DECIMAL(12,6) NOT NULL COMMENT 'Exchange rate (e.g., 1173.0 for USD to IQD)',
  `is_active` BOOLEAN DEFAULT TRUE,
  `set_by` VARCHAR(36) COMMENT 'Super admin who set this rate',
  `effective_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When this rate becomes effective',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`set_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_currency_rates_from_to` (`from_currency`, `to_currency`(10)),
  INDEX `idx_currency_rates_active` (`is_active`),
  INDEX `idx_currency_rates_effective_date` (`effective_date`)
);

-- Client locations table
CREATE TABLE `client_locations` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) COMMENT 'Optional: if user is logged in',
  `latitude` DECIMAL(10,8) NOT NULL,
  `longitude` DECIMAL(11,8) NOT NULL,
  `accuracy` INT COMMENT 'GPS accuracy in meters',
  `source` VARCHAR(32) DEFAULT 'map_button' COMMENT 'map_button, search, etc.',
  `metadata` JSON COMMENT 'userAgent, language, permissionStatus, city, country',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_client_locations_user_id` (`user_id`),
  INDEX `idx_client_locations_coordinates` (`latitude`, `longitude`),
  INDEX `idx_client_locations_created_at` (`created_at`)
);

-- Customer wave permissions table
CREATE TABLE `customer_wave_permissions` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  `user_id` VARCHAR(36) NOT NULL,
  `wave_id` VARCHAR(36) NOT NULL,
  `max_properties` INT NOT NULL DEFAULT 1 COMMENT 'How many properties customer can assign to this wave',
  `used_properties` INT DEFAULT 0 COMMENT 'How many properties customer has already assigned',
  `granted_by` VARCHAR(36) COMMENT 'Super admin who granted permission',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`wave_id`) REFERENCES `waves`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_customer_wave_permissions_user_id` (`user_id`),
  INDEX `idx_customer_wave_permissions_wave_id` (`wave_id`),
  INDEX `idx_customer_wave_permissions_granted_by` (`granted_by`),
  UNIQUE KEY `unique_user_wave` (`user_id`, `wave_id`)
);

-- Insert default data
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `first_name`, `last_name`, `wave_balance`, `allowed_languages`) VALUES
('admin-001', 'admin', 'admin@example.com', '$2a$10$hash_placeholder', 'super_admin', 'Admin', 'User', 100, '["en", "ar", "kur"]'),
('customer-001', 'customer', 'customer@example.com', '$2a$10$hash_placeholder', 'user', 'Customer', 'User', 10, '["en"]');

-- Insert default waves
INSERT INTO `waves` (`id`, `name`, `description`, `color`, `created_by`) VALUES
('wave-001', 'Basic Wave', 'Standard properties with basic visibility', '#3B82F6', 'admin-001'),
('wave-002', 'Premium Wave', 'Premium properties with special circle motion effect', '#F59E0B', 'admin-001'),
('wave-003', 'VIP Wave', 'VIP properties with maximum visibility and special effects', '#EF4444', 'admin-001');

-- Insert default currency rates
INSERT INTO `currency_rates` (`id`, `from_currency`, `to_currency`, `rate`, `set_by`) VALUES
('rate-001', 'USD', 'IQD', 1320.00, 'admin-001'),
('rate-002', 'USD', 'EUR', 0.85, 'admin-001'),
('rate-003', 'USD', 'AED', 3.67, 'admin-001');

-- Sample properties (optional)
INSERT INTO `properties` (`id`, `title`, `description`, `type`, `listing_type`, `price`, `currency`, `bedrooms`, `bathrooms`, `area`, `address`, `city`, `country`, `latitude`, `longitude`, `agent_id`, `wave_id`, `slug`) VALUES
('prop-001', 'Modern Villa in Erbil', 'Beautiful modern villa with garden and pool', 'villa', 'sale', 450000.00, 'USD', 4, 3, 350, '123 Garden Street', 'Erbil', 'Iraq', 36.1911, 44.0089, 'admin-001', 'wave-002', 'modern-villa-erbil-001'),
('prop-002', 'Downtown Apartment', 'Spacious apartment in city center', 'apartment', 'rent', 1200.00, 'USD', 2, 2, 120, '456 Main Avenue', 'Baghdad', 'Iraq', 33.3152, 44.3661, 'admin-001', 'wave-001', 'downtown-apartment-baghdad-002'),
('prop-003', 'Luxury Penthouse', 'Premium penthouse with city views', 'apartment', 'sale', 750000.00, 'USD', 3, 2, 200, '789 Skyline Tower', 'Sulaymaniyah', 'Iraq', 35.5605, 45.4330, 'admin-001', 'wave-003', 'luxury-penthouse-sulaymaniyah-003');