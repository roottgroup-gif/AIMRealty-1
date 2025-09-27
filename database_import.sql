-- MapEstate Database Schema and Sample Data
-- Complete database setup for local development

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `mapestate_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Select the database to use
USE `mapestate_db`;

-- Disable foreign key checks for clean import
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables (in reverse dependency order)
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

-- Create users table
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `username` varchar(191) NOT NULL,
  `email` varchar(320) NOT NULL,
  `password` text NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `first_name` text,
  `last_name` text,
  `phone` text,
  `avatar` text,
  `is_verified` boolean DEFAULT false,
  `wave_balance` int DEFAULT 10,
  `expires_at` timestamp NULL,
  `is_expired` boolean DEFAULT false,
  `allowed_languages` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create waves table
CREATE TABLE `waves` (
  `id` varchar(36) NOT NULL,
  `name` text NOT NULL,
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

-- Create properties table
CREATE TABLE `properties` (
  `id` varchar(36) NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `type` text NOT NULL,
  `listing_type` text NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `bedrooms` int,
  `bathrooms` int,
  `area` int,
  `address` text NOT NULL,
  `city` text NOT NULL,
  `country` text NOT NULL,
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `images` json,
  `amenities` json,
  `features` json,
  `status` varchar(16) DEFAULT 'active',
  `language` varchar(3) NOT NULL DEFAULT 'en',
  `agent_id` varchar(36),
  `contact_phone` text,
  `wave_id` varchar(36),
  `views` int DEFAULT 0,
  `is_featured` boolean DEFAULT false,
  `slug` varchar(255),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_properties_city` (`city`(100)),
  KEY `idx_properties_type` (`type`(50)),
  KEY `idx_properties_listing_type` (`listing_type`(10)),
  KEY `idx_properties_price` (`price`),
  KEY `idx_properties_status` (`status`),
  KEY `idx_properties_language` (`language`),
  KEY `idx_properties_created_at` (`created_at`),
  KEY `fk_properties_agent` (`agent_id`),
  KEY `fk_properties_wave` (`wave_id`),
  CONSTRAINT `fk_properties_agent` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_properties_wave` FOREIGN KEY (`wave_id`) REFERENCES `waves` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create inquiries table
CREATE TABLE `inquiries` (
  `id` varchar(36) NOT NULL,
  `property_id` varchar(36),
  `user_id` varchar(36),
  `name` text NOT NULL,
  `email` text NOT NULL,
  `phone` text,
  `message` text NOT NULL,
  `status` varchar(16) DEFAULT 'pending',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_inquiries_property` (`property_id`),
  KEY `fk_inquiries_user` (`user_id`),
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
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_favorites_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create search_history table
CREATE TABLE `search_history` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36),
  `query` text NOT NULL,
  `filters` json,
  `results` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_search_history_user` (`user_id`),
  CONSTRAINT `fk_search_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create customer_activity table
CREATE TABLE `customer_activity` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `activity_type` text NOT NULL,
  `property_id` varchar(36),
  `metadata` json,
  `points` int DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_customer_activity_user` (`user_id`),
  KEY `fk_customer_activity_property` (`property_id`),
  CONSTRAINT `fk_customer_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_customer_activity_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
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

-- Create user_preferences table
CREATE TABLE `user_preferences` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `preferred_property_types` json,
  `preferred_listing_types` json,
  `budget_range` json,
  `preferred_locations` json,
  `preferred_bedrooms` json,
  `preferred_amenities` json,
  `viewing_history` json,
  `interaction_scores` json,
  `last_recommendation_update` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_preferences_user_id_unique` (`user_id`),
  CONSTRAINT `fk_user_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_recommendations table
CREATE TABLE `user_recommendations` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `property_id` varchar(36) NOT NULL,
  `recommendation_type` text NOT NULL,
  `confidence` decimal(3,2) NOT NULL DEFAULT 0.50,
  `reasoning` json,
  `is_viewed` boolean DEFAULT false,
  `is_clicked` boolean DEFAULT false,
  `is_favorited` boolean DEFAULT false,
  `feedback_score` int,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp DEFAULT (NOW() + INTERVAL 7 DAY),
  PRIMARY KEY (`id`),
  KEY `fk_user_recommendations_user` (`user_id`),
  KEY `fk_user_recommendations_property` (`property_id`),
  CONSTRAINT `fk_user_recommendations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_user_recommendations_property` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create property_similarity table
CREATE TABLE `property_similarity` (
  `id` varchar(36) NOT NULL,
  `property_id_1` varchar(36) NOT NULL,
  `property_id_2` varchar(36) NOT NULL,
  `similarity_score` decimal(3,2) NOT NULL,
  `similarity_factors` json,
  `calculated_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_property_similarity_1` (`property_id_1`),
  KEY `fk_property_similarity_2` (`property_id_2`),
  CONSTRAINT `fk_property_similarity_1` FOREIGN KEY (`property_id_1`) REFERENCES `properties` (`id`),
  CONSTRAINT `fk_property_similarity_2` FOREIGN KEY (`property_id_2`) REFERENCES `properties` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create recommendation_analytics table
CREATE TABLE `recommendation_analytics` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36),
  `recommendation_type` text NOT NULL,
  `total_generated` int DEFAULT 0,
  `total_viewed` int DEFAULT 0,
  `total_clicked` int DEFAULT 0,
  `total_favorited` int DEFAULT 0,
  `click_through_rate` decimal(3,2) DEFAULT 0.00,
  `conversion_rate` decimal(3,2) DEFAULT 0.00,
  `avg_confidence_score` decimal(3,2) DEFAULT 0.50,
  `period` text NOT NULL,
  `date` timestamp NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_recommendation_analytics_user` (`user_id`),
  CONSTRAINT `fk_recommendation_analytics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create currency_rates table
CREATE TABLE `currency_rates` (
  `id` varchar(36) NOT NULL,
  `from_currency` varchar(3) NOT NULL DEFAULT 'USD',
  `to_currency` text NOT NULL,
  `rate` decimal(12,6) NOT NULL,
  `is_active` boolean DEFAULT true,
  `set_by` varchar(36),
  `effective_date` timestamp DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_currency_rates_set_by` (`set_by`),
  CONSTRAINT `fk_currency_rates_set_by` FOREIGN KEY (`set_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create client_locations table
CREATE TABLE `client_locations` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36),
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `accuracy` int,
  `source` varchar(32) DEFAULT 'map_button',
  `metadata` json,
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
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `first_name`, `last_name`, `phone`, `is_verified`, `allowed_languages`) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john_agent', 'john@estateai.com', '$2b$10$hash123', 'agent', 'John', 'Smith', '+964 750 123 4567', true, '[\"en\", \"ar\", \"kur\"]'),
('550e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@estateai.com', '$2b$10$hash123', 'super_admin', 'Admin', 'User', '+964 750 123 4568', true, '[\"en\", \"ar\", \"kur\"]'),
('550e8400-e29b-41d4-a716-446655440002', 'customer1', 'customer@example.com', '$2b$10$hash123', 'user', 'Ahmed', 'Ali', '+964 750 123 4569', true, '[\"en\", \"ar\"]');

-- Insert sample wave
INSERT INTO `waves` (`id`, `name`, `description`, `color`, `is_active`, `created_by`) VALUES
('wave-001', 'Premium Properties', 'High-end luxury properties for premium clients', '#FFD700', true, '550e8400-e29b-41d4-a716-446655440001');

-- Insert sample properties
INSERT INTO `properties` (`id`, `title`, `description`, `type`, `listing_type`, `price`, `currency`, `bedrooms`, `bathrooms`, `area`, `address`, `city`, `country`, `latitude`, `longitude`, `images`, `amenities`, `features`, `agent_id`, `is_featured`, `language`, `wave_id`) VALUES
('prop-001', 'Luxury Villa in Erbil', 'A stunning 4-bedroom villa with modern amenities, located in the heart of Erbil. Features include a spacious living area, modern kitchen, garden, and parking.', 'villa', 'sale', 450000.00, 'USD', 4, 3, 3200, 'Gulan Street, Erbil City Center', 'Erbil', 'Iraq', 36.19110000, 44.00930000, '[\"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9\", \"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c\", \"https://images.unsplash.com/photo-1613490493576-7fde63acd811\"]', '[\"Swimming Pool\", \"Garden\", \"Parking\", \"Security System\"]', '[\"Central AC\", \"Modern Kitchen\", \"Balcony\", \"Storage Room\"]', '550e8400-e29b-41d4-a716-446655440000', true, 'en', 'wave-001'),

('prop-002', 'Modern Apartment in Baghdad', 'A beautiful 2-bedroom apartment in a prime location in Baghdad. Perfect for young professionals or small families.', 'apartment', 'rent', 800.00, 'USD', 2, 2, 1200, 'Al-Mansour District, Baghdad', 'Baghdad', 'Iraq', 33.31520000, 44.36610000, '[\"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267\", \"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00\", \"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688\"]', '[\"Elevator\", \"Parking\", \"24/7 Security\"]', '[\"Modern Kitchen\", \"Balcony\", \"Internet Ready\"]', '550e8400-e29b-41d4-a716-446655440000', true, 'ar', 'wave-001'),

('prop-003', 'Family House in Sulaymaniyah', 'A comfortable 3-bedroom family house with a beautiful garden. Located in a quiet neighborhood.', 'house', 'sale', 180000.00, 'USD', 3, 2, 2000, 'Azadi Street, Sulaymaniyah', 'Sulaymaniyah', 'Iraq', 35.56510000, 45.43050000, '[\"https://images.unsplash.com/photo-1570129477492-45c003edd2be\", \"https://images.unsplash.com/photo-1449824913935-59a10b8d2000\", \"https://images.unsplash.com/photo-1558618666-fcd25c85cd64\"]', '[\"Garden\", \"Parking\", \"Basement\"]', '[\"Fireplace\", \"Large Windows\", \"Storage\"]', '550e8400-e29b-41d4-a716-446655440000', false, 'kur', NULL),

('prop-004', 'Commercial Land in Erbil', 'Prime commercial land perfect for business development. Located on a main road with high traffic.', 'land', 'sale', 250000.00, 'USD', NULL, NULL, 5000, '100 Meter Road, Erbil', 'Erbil', 'Iraq', 36.20000000, 44.02000000, '[\"https://images.unsplash.com/photo-1500382017468-9049fed747ef\", \"https://images.unsplash.com/photo-1441974231531-c6227db76b6e\", \"https://images.unsplash.com/photo-1497366216548-37526070297c\"]', '[\"Main Road Access\", \"Utilities Available\"]', '[\"Corner Lot\", \"High Traffic Area\", \"Development Ready\"]', '550e8400-e29b-41d4-a716-446655440000', false, 'en', NULL),

('prop-005', 'Cozy Studio Apartment', 'A modern studio apartment perfect for students or young professionals. Fully furnished and ready to move in.', 'apartment', 'rent', 400.00, 'USD', 1, 1, 600, 'University Street, Erbil', 'Erbil', 'Iraq', 36.18000000, 44.00000000, '[\"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af\", \"https://images.unsplash.com/photo-1555854877-bab0e00b7ceb\", \"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab\"]', '[\"Furnished\", \"WiFi\", \"Utilities Included\"]', '[\"Compact Design\", \"Modern Appliances\", \"Near University\"]', '550e8400-e29b-41d4-a716-446655440000', true, 'ar', 'wave-001'),

('prop-006', 'Mountain View Villa in Duhok', 'Contemporary villa featuring swimming pool, landscaped gardens, and mountain views.', 'villa', 'sale', 380000.00, 'USD', 5, 4, 3500, 'Nakhla District, Duhok', 'Duhok', 'Iraq', 36.86280000, 42.97820000, '[\"https://images.unsplash.com/photo-1613490493576-7fde63acd811\", \"https://images.unsplash.com/photo-1600607687644-c7171b42498b\", \"https://images.unsplash.com/photo-1600607687920-4e2a09cf159d\"]', '[\"Swimming Pool\", \"Garden\", \"Mountain Views\", \"Garage\"]', '[\"Open Plan Living\", \"Master Suite\", \"Entertainment Area\"]', '550e8400-e29b-41d4-a716-446655440000', true, 'en', 'wave-001');

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

-- Insert additional indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);

-- Show completion message
SELECT 'Database setup completed successfully! 🎉' as message, 
       'Database: mapestate_db' as database_name,
       '16 tables created' as tables_count,
       '3 users, 6 properties, 3 currencies' as sample_data;