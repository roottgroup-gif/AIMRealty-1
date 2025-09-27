-- MapEstate Normalized Database Schema - Pure MySQL (No JSON)
-- All data stored in proper relational tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `mapestate_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Select the database to use
USE `mapestate_db`;

-- Disable foreign key checks for clean import
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS `user_languages`;
DROP TABLE IF EXISTS `property_images`;
DROP TABLE IF EXISTS `property_amenities`;
DROP TABLE IF EXISTS `property_features`;
DROP TABLE IF EXISTS `search_filters`;
DROP TABLE IF EXISTS `activity_metadata`;
DROP TABLE IF EXISTS `customer_wave_permissions`;
DROP TABLE IF EXISTS `waves`;
DROP TABLE IF EXISTS `client_locations`;
DROP TABLE IF EXISTS `currency_rates`;
DROP TABLE IF EXISTS `recommendation_analytics`;
DROP TABLE IF EXISTS `property_similarity`;
DROP TABLE IF EXISTS `user_recommendations`;
DROP TABLE IF EXISTS `user_preferences`;
DROP TABLE IF EXISTS `customer_points`;
DROP TABLE IF EXISTS `customer_activity`;
DROP TABLE IF EXISTS `search_history`;
DROP TABLE IF EXISTS `favorites`;
DROP TABLE IF EXISTS `inquiries`;
DROP TABLE IF EXISTS `properties`;
DROP TABLE IF EXISTS `users`;

-- Create users table (no JSON)
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(191) NOT NULL,
  `email` varchar(320) NOT NULL,
  `password` text NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `first_name` varchar(100),
  `last_name` varchar(100),
  `phone` varchar(20),
  `avatar` text,
  `is_verified` boolean DEFAULT false,
  `wave_balance` int DEFAULT 10,
  `expires_at` timestamp NULL,
  `is_expired` boolean DEFAULT false,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_languages table (normalized from users.allowed_languages JSON)
CREATE TABLE `user_languages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` varchar(36) NOT NULL,
  `language` varchar(3) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `fk_user_languages_user` (`user_id`),
  UNIQUE KEY `unique_user_language` (`user_id`, `language`),
  CONSTRAINT `fk_user_languages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create waves table
CREATE TABLE `waves` (
  `id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `color` varchar(7) DEFAULT '#3B82F6',
  `is_active` boolean DEFAULT true,
  `created_by` varchar(36),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_waves_created_by` (`created_by`),
  CONSTRAINT `fk_waves_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create properties table (no JSON columns)
CREATE TABLE `properties` (
  `id` varchar(36) NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `type` varchar(50) NOT NULL,
  `listing_type` varchar(20) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `bedrooms` int,
  `bathrooms` int,
  `area` int,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `status` varchar(16) DEFAULT 'active',
  `language` varchar(3) NOT NULL DEFAULT 'en',
  `agent_id` varchar(36),
  `contact_phone` varchar(20),
  `wave_id` varchar(36),
  `views` int DEFAULT 0,
  `is_featured` boolean DEFAULT false,
  `slug` varchar(255),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_properties_city` (`city`),
  KEY `idx_properties_type` (`type`),
  KEY `idx_properties_listing_type` (`listing_type`),
  KEY `idx_properties_price` (`price`),
  KEY `idx_properties_status` (`status`),
  KEY `idx_properties_language` (`language`),
  KEY `idx_properties_created_at` (`created_at`),
  KEY `fk_properties_agent` (`agent_id`),
  KEY `fk_properties_wave` (`wave_id`),
  CONSTRAINT `fk_properties_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_properties_wave` FOREIGN KEY (`wave_id`) REFERENCES `waves` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create property_images table (normalized from properties.images JSON)
CREATE TABLE `property_images` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `property_id` varchar(36) NOT NULL,
  `image_url` text NOT NULL,
  `sort_order` int DEFAULT 0,
  `alt_text` varchar(255),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `fk_property_images_property` (`property_id`),
  KEY `idx_property_images_sort` (`property_id`, `sort_order`),
  CONSTRAINT `fk_property_images_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create property_amenities table (normalized from properties.amenities JSON)
CREATE TABLE `property_amenities` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `property_id` varchar(36) NOT NULL,
  `amenity` varchar(100) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `fk_property_amenities_property` (`property_id`),
  KEY `idx_amenity_name` (`amenity`),
  UNIQUE KEY `unique_property_amenity` (`property_id`, `amenity`),
  CONSTRAINT `fk_property_amenities_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create property_features table (normalized from properties.features JSON)
CREATE TABLE `property_features` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `property_id` varchar(36) NOT NULL,
  `feature` varchar(100) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `fk_property_features_property` (`property_id`),
  KEY `idx_feature_name` (`feature`),
  UNIQUE KEY `unique_property_feature` (`property_id`, `feature`),
  CONSTRAINT `fk_property_features_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create inquiries table
CREATE TABLE `inquiries` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36),
  `user_id` varchar(36),
  `name` varchar(200) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(20),
  `message` text NOT NULL,
  `status` varchar(16) DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_inquiries_property` (`property_id`),
  KEY `fk_inquiries_user` (`user_id`),
  KEY `idx_inquiries_status` (`status`),
  KEY `idx_inquiries_created_at` (`created_at`),
  CONSTRAINT `fk_inquiries_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`),
  CONSTRAINT `fk_inquiries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create favorites table
CREATE TABLE `favorites` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36),
  `property_id` varchar(36),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_favorites_user` (`user_id`),
  KEY `fk_favorites_property` (`property_id`),
  UNIQUE KEY `unique_user_property_favorite` (`user_id`, `property_id`),
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create search_history table
CREATE TABLE `search_history` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36),
  `query` text NOT NULL,
  `results` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_search_history_user` (`user_id`),
  CONSTRAINT `fk_search_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create search_filters table (normalized from search_history.filters JSON)
CREATE TABLE `search_filters` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `search_id` varchar(36) NOT NULL,
  `filter_key` varchar(50) NOT NULL,
  `filter_value` varchar(200) NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `fk_search_filters_search` (`search_id`),
  CONSTRAINT `fk_search_filters_search` FOREIGN KEY (`search_id`) REFERENCES `search_history` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create customer_activity table
CREATE TABLE `customer_activity` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `property_id` varchar(36),
  `points` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_customer_activity_user` (`user_id`),
  KEY `fk_customer_activity_property` (`property_id`),
  KEY `idx_activity_type` (`activity_type`),
  CONSTRAINT `fk_customer_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_customer_activity_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create activity_metadata table (normalized from customer_activity.metadata JSON)
CREATE TABLE `activity_metadata` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `activity_id` varchar(36) NOT NULL,
  `metadata_key` varchar(50) NOT NULL,
  `metadata_value` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `fk_activity_metadata_activity` (`activity_id`),
  CONSTRAINT `fk_activity_metadata_activity` FOREIGN KEY (`activity_id`) REFERENCES `customer_activity` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create customer_points table
CREATE TABLE `customer_points` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `total_points` int DEFAULT 0,
  `current_level` varchar(20) DEFAULT 'Bronze',
  `points_this_month` int DEFAULT 0,
  `last_activity` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_points_user_id_unique` (`user_id`),
  CONSTRAINT `fk_customer_points_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create currency_rates table
CREATE TABLE `currency_rates` (
  `id` varchar(36) NOT NULL,
  `from_currency` varchar(3) NOT NULL DEFAULT 'USD',
  `to_currency` varchar(3) NOT NULL,
  `rate` decimal(12,6) NOT NULL,
  `is_active` boolean DEFAULT true,
  `set_by` varchar(36),
  `effective_date` timestamp DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_currency_rates_set_by` (`set_by`),
  KEY `idx_currency_pair` (`from_currency`, `to_currency`),
  CONSTRAINT `fk_currency_rates_set_by` FOREIGN KEY (`set_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create client_locations table (simplified, no JSON metadata)
CREATE TABLE `client_locations` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36),
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `accuracy` int,
  `source` varchar(32) DEFAULT 'map_button',
  `user_agent` text,
  `language` varchar(10),
  `permission_status` varchar(20),
  `city` varchar(100),
  `country` varchar(100),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_client_locations_user` (`user_id`),
  CONSTRAINT `fk_client_locations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create customer_wave_permissions table
CREATE TABLE `customer_wave_permissions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `wave_id` varchar(36) NOT NULL,
  `max_properties` int NOT NULL DEFAULT 1,
  `used_properties` int DEFAULT 0,
  `granted_by` varchar(36),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_customer_wave_permissions_user` (`user_id`),
  KEY `fk_customer_wave_permissions_wave` (`wave_id`),
  KEY `fk_customer_wave_permissions_granted_by` (`granted_by`),
  CONSTRAINT `fk_customer_wave_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_customer_wave_permissions_wave` FOREIGN KEY (`wave_id`) REFERENCES `waves` (`id`),
  CONSTRAINT `fk_customer_wave_permissions_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Insert sample users
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `first_name`, `last_name`, `phone`, `is_verified`) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john_agent', 'john@estateai.com', '$2b$10$hash123', 'agent', 'John', 'Smith', '+964 750 123 4567', true),
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@estateai.com', '$2b$10$hash123', 'super_admin', 'Admin', 'User', '+964 750 123 4568', true),
('550e8400-e29b-41d4-a716-446655440002', 'customer1', 'customer@example.com', '$2b$10$hash123', 'user', 'Ahmed', 'Ali', '+964 750 123 4569', true);

-- Insert user languages (normalized)
INSERT INTO `user_languages` (`user_id`, `language`) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'en'),
('550e8400-e29b-41d4-a716-446655440000', 'ar'),
('550e8400-e29b-41d4-a716-446655440000', 'kur'),
('550e8400-e29b-41d4-a716-446655440001', 'en'),
('550e8400-e29b-41d4-a716-446655440001', 'ar'),
('550e8400-e29b-41d4-a716-446655440001', 'kur'),
('550e8400-e29b-41d4-a716-446655440002', 'en'),
('550e8400-e29b-41d4-a716-446655440002', 'ar');

-- Insert sample wave
INSERT INTO `waves` (`id`, `name`, `description`, `color`, `is_active`, `created_by`) VALUES
('wave-001', 'Premium Properties', 'High-end luxury properties for premium clients', '#FFD700', true, '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample properties
INSERT INTO `properties` (`id`, `title`, `description`, `type`, `listing_type`, `price`, `currency`, `bedrooms`, `bathrooms`, `area`, `address`, `city`, `country`, `latitude`, `longitude`, `agent_id`, `is_featured`, `language`, `wave_id`) VALUES
('prop-001', 'Luxury Villa in Erbil', 'A stunning 4-bedroom villa with modern amenities, located in the heart of Erbil. Features include a spacious living area, modern kitchen, garden, and parking.', 'villa', 'sale', 450000.00, 'USD', 4, 3, 3200, 'Gulan Street, Erbil City Center', 'Erbil', 'Iraq', 36.19110000, 44.00930000, '550e8400-e29b-41d4-a716-446655440000', true, 'en', 'wave-001'),

('prop-002', 'Modern Apartment in Baghdad', 'A beautiful 2-bedroom apartment in a prime location in Baghdad. Perfect for young professionals or small families.', 'apartment', 'rent', 800.00, 'USD', 2, 2, 1200, 'Al-Mansour District, Baghdad', 'Baghdad', 'Iraq', 33.31520000, 44.36610000, '550e8400-e29b-41d4-a716-446655440000', true, 'ar', 'wave-001'),

('prop-003', 'Family House in Sulaymaniyah', 'A comfortable 3-bedroom family house with a beautiful garden. Located in a quiet neighborhood.', 'house', 'sale', 180000.00, 'USD', 3, 2, 2000, 'Azadi Street, Sulaymaniyah', 'Sulaymaniyah', 'Iraq', 35.56510000, 45.43050000, '550e8400-e29b-41d4-a716-446655440000', false, 'kur', NULL),

('prop-004', 'Commercial Land in Erbil', 'Prime commercial land perfect for business development. Located on a main road with high traffic.', 'land', 'sale', 250000.00, 'USD', NULL, NULL, 5000, '100 Meter Road, Erbil', 'Erbil', 'Iraq', 36.20000000, 44.02000000, '550e8400-e29b-41d4-a716-446655440000', false, 'en', NULL),

('prop-005', 'Cozy Studio Apartment', 'A modern studio apartment perfect for students or young professionals. Fully furnished and ready to move in.', 'apartment', 'rent', 400.00, 'USD', 1, 1, 600, 'University Street, Erbil', 'Erbil', 'Iraq', 36.18000000, 44.00000000, '550e8400-e29b-41d4-a716-446655440000', true, 'ar', 'wave-001'),

('prop-006', 'Mountain View Villa in Duhok', 'Contemporary villa featuring swimming pool, landscaped gardens, and mountain views.', 'villa', 'sale', 380000.00, 'USD', 5, 4, 3500, 'Nakhla District, Duhok', 'Duhok', 'Iraq', 36.86280000, 42.97820000, '550e8400-e29b-41d4-a716-446655440000', true, 'en', 'wave-001');

-- Insert property images (normalized)
INSERT INTO `property_images` (`property_id`, `image_url`, `sort_order`, `alt_text`) VALUES
('prop-001', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9', 1, 'Luxury Villa Front View'),
('prop-001', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c', 2, 'Villa Interior'),
('prop-001', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811', 3, 'Villa Garden'),

('prop-002', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', 1, 'Modern Apartment Exterior'),
('prop-002', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00', 2, 'Apartment Living Room'),
('prop-002', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', 3, 'Apartment Kitchen'),

('prop-003', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be', 1, 'Family House Front'),
('prop-003', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000', 2, 'House Garden'),
('prop-003', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64', 3, 'House Interior'),

('prop-004', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef', 1, 'Commercial Land View'),
('prop-004', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 2, 'Land Location'),
('prop-004', 'https://images.unsplash.com/photo-1497366216548-37526070297c', 3, 'Development Area'),

('prop-005', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af', 1, 'Studio Apartment'),
('prop-005', 'https://images.unsplash.com/photo-1555854877-bab0e00b7ceb', 2, 'Studio Living Area'),
('prop-005', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab', 3, 'Studio Kitchen'),

('prop-006', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811', 1, 'Mountain Villa'),
('prop-006', 'https://images.unsplash.com/photo-1600607687644-c7171b42498b', 2, 'Villa Pool'),
('prop-006', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d', 3, 'Mountain View');

-- Insert property amenities (normalized)
INSERT INTO `property_amenities` (`property_id`, `amenity`) VALUES
('prop-001', 'Swimming Pool'), ('prop-001', 'Garden'), ('prop-001', 'Parking'), ('prop-001', 'Security System'),
('prop-002', 'Elevator'), ('prop-002', 'Parking'), ('prop-002', '24/7 Security'),
('prop-003', 'Garden'), ('prop-003', 'Parking'), ('prop-003', 'Basement'),
('prop-004', 'Main Road Access'), ('prop-004', 'Utilities Available'),
('prop-005', 'Furnished'), ('prop-005', 'WiFi'), ('prop-005', 'Utilities Included'),
('prop-006', 'Swimming Pool'), ('prop-006', 'Garden'), ('prop-006', 'Mountain Views'), ('prop-006', 'Garage');

-- Insert property features (normalized)
INSERT INTO `property_features` (`property_id`, `feature`) VALUES
('prop-001', 'Central AC'), ('prop-001', 'Modern Kitchen'), ('prop-001', 'Balcony'), ('prop-001', 'Storage Room'),
('prop-002', 'Modern Kitchen'), ('prop-002', 'Balcony'), ('prop-002', 'Internet Ready'),
('prop-003', 'Fireplace'), ('prop-003', 'Large Windows'), ('prop-003', 'Storage'),
('prop-004', 'Corner Lot'), ('prop-004', 'High Traffic Area'), ('prop-004', 'Development Ready'),
('prop-005', 'Compact Design'), ('prop-005', 'Modern Appliances'), ('prop-005', 'Near University'),
('prop-006', 'Open Plan Living'), ('prop-006', 'Master Suite'), ('prop-006', 'Entertainment Area');

-- Insert sample currency rates
INSERT INTO `currency_rates` (`id`, `from_currency`, `to_currency`, `rate`, `is_active`, `set_by`) VALUES
('cur-001', 'USD', 'IQD', 1310.000000, true, '550e8400-e29b-41d4-a716-446655440001'),
('cur-002', 'USD', 'EUR', 0.850000, true, '550e8400-e29b-41d4-a716-446655440001'),
('cur-003', 'USD', 'AED', 3.670000, true, '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample customer points
INSERT INTO `customer_points` (`id`, `user_id`, `total_points`, `current_level`, `points_this_month`) VALUES
('points-001', '550e8400-e29b-41d4-a716-446655440002', 250, 'Silver', 50);

-- Insert sample inquiry
INSERT INTO `inquiries` (`id`, `property_id`, `user_id`, `name`, `email`, `phone`, `message`, `status`) VALUES
('inq-001', 'prop-001', '550e8400-e29b-41d4-a716-446655440002', 'Ahmed Ali', 'customer@example.com', '+964 750 123 4569', 'I am interested in this villa. Can you provide more details about the price and viewing schedule?', 'pending');

-- Insert sample favorite
INSERT INTO `favorites` (`id`, `user_id`, `property_id`) VALUES
('fav-001', '550e8400-e29b-41d4-a716-446655440002', 'prop-001');

-- Insert sample search history
INSERT INTO `search_history` (`id`, `user_id`, `query`, `results`) VALUES
('search-001', '550e8400-e29b-41d4-a716-446655440002', 'villa in erbil', 2);

-- Insert sample search filters
INSERT INTO `search_filters` (`search_id`, `filter_key`, `filter_value`) VALUES
('search-001', 'type', 'villa'),
('search-001', 'city', 'erbil'),
('search-001', 'maxPrice', '500000');

-- Insert sample customer activity
INSERT INTO `customer_activity` (`id`, `user_id`, `activity_type`, `property_id`, `points`) VALUES
('activity-001', '550e8400-e29b-41d4-a716-446655440002', 'property_view', 'prop-001', 5),
('activity-002', '550e8400-e29b-41d4-a716-446655440002', 'favorite_add', 'prop-001', 10);

-- Insert sample activity metadata
INSERT INTO `activity_metadata` (`activity_id`, `metadata_key`, `metadata_value`) VALUES
('activity-001', 'viewDuration', '45'),
('activity-001', 'device', 'mobile'),
('activity-002', 'source', 'property_detail_page');

-- Show completion message
SELECT 'Normalized database setup completed successfully! 🎉' as message, 
       'Database: mapestate_db' as database_name,
       '16 main tables + 7 normalized tables = 23 total tables' as tables_count,
       'All JSON columns eliminated - Pure MySQL relational structure' as structure,
       'Sample data: 3 users, 6 properties with images/amenities/features' as sample_data;