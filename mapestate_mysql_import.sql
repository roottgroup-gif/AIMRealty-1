-- MapEstate MySQL Database Schema - Fresh Import
-- Compatible with XAMPP MySQL/MariaDB
-- 
-- Import Instructions:
--   1. Start XAMPP and ensure MySQL service is running
--   2. Open phpMyAdmin (http://localhost/phpmyadmin)
--   3. Create database 'mapestate' or use existing one
--   4. Import this file
-- 
-- Alternative command line:
--   mysql -u root -p mapestate < mapestate_mysql_import.sql

-- =====================================================
-- Database Setup
-- =====================================================

-- Create database with proper charset
CREATE DATABASE IF NOT EXISTS mapestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mapestate;

-- Clear existing tables if they exist (optional - comment out if you want to keep data)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS customer_wave_permissions;
DROP TABLE IF EXISTS client_locations;
DROP TABLE IF EXISTS currency_rates;
DROP TABLE IF EXISTS recommendation_analytics;
DROP TABLE IF EXISTS property_similarity;
DROP TABLE IF EXISTS user_recommendations;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS customer_points;
DROP TABLE IF EXISTS customer_activity;
DROP TABLE IF EXISTS search_history;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS inquiries;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS waves;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Table Creation
-- =====================================================

-- 1. Users Table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(191) NOT NULL UNIQUE,
  email VARCHAR(320) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  wave_balance INT DEFAULT 10,
  expires_at TIMESTAMP NULL,
  is_expired BOOLEAN DEFAULT FALSE,
  allowed_languages JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Waves Table
CREATE TABLE waves (
  id VARCHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Properties Table
CREATE TABLE properties (
  id VARCHAR(36) PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  listing_type TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  bedrooms INT,
  bathrooms INT,
  area INT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  images JSON,
  amenities JSON,
  features JSON,
  status VARCHAR(16) DEFAULT 'active',
  language VARCHAR(3) NOT NULL DEFAULT 'en',
  agent_id VARCHAR(36),
  contact_phone TEXT,
  wave_id VARCHAR(36),
  views INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (wave_id) REFERENCES waves(id) ON DELETE SET NULL
);

-- 4. Inquiries Table
CREATE TABLE inquiries (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36),
  user_id VARCHAR(36),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status VARCHAR(16) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Favorites Table
CREATE TABLE favorites (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  property_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 6. Search History Table
CREATE TABLE search_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  query TEXT NOT NULL,
  filters JSON,
  results INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Customer Activity Table
CREATE TABLE customer_activity (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  activity_type TEXT NOT NULL,
  property_id VARCHAR(36),
  metadata JSON,
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- 8. Customer Points Table
CREATE TABLE customer_points (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  total_points INT DEFAULT 0,
  current_level VARCHAR(20) DEFAULT 'Bronze',
  points_this_month INT DEFAULT 0,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. User Preferences Table
CREATE TABLE user_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  preferred_property_types JSON,
  preferred_listing_types JSON,
  budget_range JSON,
  preferred_locations JSON,
  preferred_bedrooms JSON,
  preferred_amenities JSON,
  viewing_history JSON,
  interaction_scores JSON,
  last_recommendation_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. User Recommendations Table
CREATE TABLE user_recommendations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  property_id VARCHAR(36) NOT NULL,
  recommendation_type TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  reasoning JSON,
  is_viewed BOOLEAN DEFAULT FALSE,
  is_clicked BOOLEAN DEFAULT FALSE,
  is_favorited BOOLEAN DEFAULT FALSE,
  feedback_score INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL 7 DAY),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- 11. Property Similarity Table
CREATE TABLE property_similarity (
  id VARCHAR(36) PRIMARY KEY,
  property_id_1 VARCHAR(36) NOT NULL,
  property_id_2 VARCHAR(36) NOT NULL,
  similarity_score DECIMAL(3,2) NOT NULL,
  similarity_factors JSON,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id_1) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id_2) REFERENCES properties(id) ON DELETE CASCADE
);

-- 12. Recommendation Analytics Table
CREATE TABLE recommendation_analytics (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  recommendation_type TEXT NOT NULL,
  total_generated INT DEFAULT 0,
  total_viewed INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_favorited INT DEFAULT 0,
  click_through_rate DECIMAL(3,2) DEFAULT 0.00,
  conversion_rate DECIMAL(3,2) DEFAULT 0.00,
  avg_confidence_score DECIMAL(3,2) DEFAULT 0.50,
  period TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Currency Rates Table
CREATE TABLE currency_rates (
  id VARCHAR(36) PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  to_currency TEXT NOT NULL,
  rate DECIMAL(12,6) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  set_by VARCHAR(36),
  effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (set_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Client Locations Table
CREATE TABLE client_locations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy INT,
  source VARCHAR(32) DEFAULT 'map_button',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 15. Customer Wave Permissions Table
CREATE TABLE customer_wave_permissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  wave_id VARCHAR(36) NOT NULL,
  max_properties INT NOT NULL DEFAULT 1,
  used_properties INT DEFAULT 0,
  granted_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wave_id) REFERENCES waves(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Properties indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city(100));
CREATE INDEX idx_properties_type ON properties(type(50));
CREATE INDEX idx_properties_listing_type ON properties(listing_type(10));
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_wave_id ON properties(wave_id);
CREATE INDEX idx_properties_slug ON properties(slug);

-- Other indexes
CREATE INDEX idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);
CREATE INDEX idx_customer_activity_user_id ON customer_activity(user_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);

-- =====================================================
-- Default Data
-- =====================================================

-- Insert Super Admin User
INSERT INTO users (id, username, email, password, role, first_name, last_name, allowed_languages, is_verified, wave_balance) 
VALUES (
  'admin-001', 
  'admin', 
  'admin@mapestate.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'super_admin', 
  'System', 
  'Administrator',
  JSON_ARRAY('en', 'ar', 'kur'),
  TRUE,
  999999
);

-- Insert Sample Agent User
INSERT INTO users (id, username, email, password, role, first_name, last_name, phone, allowed_languages, is_verified) 
VALUES (
  'agent-001', 
  'john_agent', 
  'john@mapestate.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'user', 
  'John', 
  'Smith',
  '+964750123456',
  JSON_ARRAY('en', 'ar'),
  TRUE
);

-- Insert Sample Customer User
INSERT INTO users (id, username, email, password, role, first_name, last_name, phone, allowed_languages, is_verified) 
VALUES (
  'customer-001', 
  'sarah_customer', 
  'sarah@example.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'user', 
  'Sarah', 
  'Wilson',
  '+964750654321',
  JSON_ARRAY('en'),
  TRUE
);

-- Insert Default Waves
INSERT INTO waves (id, name, description, color, created_by) 
VALUES 
  ('wave-001', 'Premium Properties', 'High-end luxury properties', '#FFD700', 'admin-001'),
  ('wave-002', 'Budget Friendly', 'Affordable housing options', '#28A745', 'admin-001'),
  ('wave-003', 'Commercial', 'Business and commercial properties', '#6F42C1', 'admin-001');

-- Insert Currency Rates
INSERT INTO currency_rates (id, from_currency, to_currency, rate, set_by, is_active) 
VALUES 
  ('rate-001', 'USD', 'IQD', 1310.00, 'admin-001', TRUE),
  ('rate-002', 'USD', 'EUR', 0.85, 'admin-001', TRUE),
  ('rate-003', 'USD', 'AED', 3.67, 'admin-001', TRUE),
  ('rate-004', 'USD', 'GBP', 0.79, 'admin-001', TRUE);

-- Insert Sample Properties
INSERT INTO properties (
  id, title, description, type, listing_type, price, currency,
  bedrooms, bathrooms, area, address, city, country,
  latitude, longitude, images, amenities, features,
  language, agent_id, contact_phone, wave_id, views, is_featured, slug
) VALUES 
-- Villa in Erbil
(
  'prop-001',
  'Luxury Villa in Ankawa',
  'Stunning 4-bedroom villa with private swimming pool and beautiful garden in the prestigious Ankawa district.',
  'villa',
  'sale',
  450000.00,
  'USD',
  4,
  3,
  350,
  'Ankawa District, Villa Complex, Block A15',
  'Erbil',
  'Iraq',
  36.2381300,
  44.0088400,
  JSON_ARRAY('/api/placeholder/800/600?text=Villa+Exterior', '/api/placeholder/800/600?text=Villa+Interior', '/api/placeholder/800/600?text=Swimming+Pool'),
  JSON_ARRAY('Swimming Pool', 'Garden', 'Garage', 'Security System', 'Balcony'),
  JSON_ARRAY('Modern Design', 'Central Heating', 'Air Conditioning', 'Marble Flooring'),
  'en',
  'agent-001',
  '+964750123456',
  'wave-001',
  247,
  TRUE,
  'luxury-villa-ankawa-erbil'
),

-- Apartment Downtown
(
  'prop-002',
  'Modern Apartment Downtown',
  'Premium 2-bedroom apartment in the heart of Erbil with city views and modern amenities.',
  'apartment',
  'rent',
  1200.00,
  'USD',
  2,
  2,
  120,
  'Downtown Center, Sky Tower, Floor 12',
  'Erbil',
  'Iraq',
  36.1900000,
  44.0090000,
  JSON_ARRAY('/api/placeholder/800/600?text=Apartment+Living', '/api/placeholder/800/600?text=City+View', '/api/placeholder/800/600?text=Modern+Kitchen'),
  JSON_ARRAY('Elevator', 'Parking', 'Gym', 'Balcony', 'Concierge'),
  JSON_ARRAY('City View', 'Furnished', 'High Floor', 'Modern Appliances'),
  'en',
  'agent-001',
  '+964750123456',
  'wave-002',
  156,
  FALSE,
  'modern-apartment-downtown-erbil'
),

-- Family House
(
  'prop-003',
  'Family House with Garden',
  'Comfortable 3-bedroom house perfect for families, featuring a large garden and quiet neighborhood.',
  'house',
  'sale',
  280000.00,
  'USD',
  3,
  2,
  200,
  'Ainkawa Residential, Street 40, House 25',
  'Erbil',
  'Iraq',
  36.2200000,
  44.0100000,
  JSON_ARRAY('/api/placeholder/800/600?text=House+Exterior', '/api/placeholder/800/600?text=Garden+View', '/api/placeholder/800/600?text=Living+Room'),
  JSON_ARRAY('Garden', 'Parking', 'Storage Room', 'Terrace'),
  JSON_ARRAY('Quiet Area', 'Near Schools', 'Recently Renovated', 'Family Friendly'),
  'en',
  'agent-001',
  '+964750123456',
  'wave-002',
  98,
  FALSE,
  'family-house-garden-ainkawa'
),

-- Commercial Property
(
  'prop-004',
  'Commercial Office Space',
  'Prime commercial office space in business district, ideal for companies and startups.',
  'office',
  'rent',
  2500.00,
  'USD',
  NULL,
  2,
  300,
  'Business District, Corporate Center, Suite 401',
  'Erbil',
  'Iraq',
  36.1950000,
  44.0050000,
  JSON_ARRAY('/api/placeholder/800/600?text=Office+Space', '/api/placeholder/800/600?text=Meeting+Room', '/api/placeholder/800/600?text=Reception'),
  JSON_ARRAY('Conference Room', 'High Speed Internet', 'Parking', 'Security', 'Reception'),
  JSON_ARRAY('Business District', 'Modern Facilities', 'Flexible Layout', 'Professional Environment'),
  'en',
  'agent-001',
  '+964750123456',
  'wave-003',
  67,
  FALSE,
  'commercial-office-space-business-district'
),

-- Budget Apartment
(
  'prop-005',
  'Affordable Student Apartment',
  'Budget-friendly 1-bedroom apartment perfect for students and young professionals.',
  'apartment',
  'rent',
  600.00,
  'USD',
  1,
  1,
  60,
  'University Area, Student Complex, Block B',
  'Erbil',
  'Iraq',
  36.2100000,
  44.0200000,
  JSON_ARRAY('/api/placeholder/800/600?text=Student+Apartment', '/api/placeholder/800/600?text=Bedroom', '/api/placeholder/800/600?text=Kitchen'),
  JSON_ARRAY('Internet', 'Laundry', 'Study Area', 'Shared Facilities'),
  JSON_ARRAY('Near University', 'Public Transport', 'Affordable', 'Student Community'),
  'en',
  'agent-001',
  '+964750123456',
  'wave-002',
  143,
  FALSE,
  'affordable-student-apartment-university'
);

-- Insert Sample Customer Activity
INSERT INTO customer_activity (id, user_id, activity_type, property_id, points, metadata) 
VALUES 
  ('activity-001', 'customer-001', 'property_view', 'prop-001', 5, JSON_OBJECT('duration', 120, 'source', 'search')),
  ('activity-002', 'customer-001', 'favorite_add', 'prop-002', 10, JSON_OBJECT('source', 'property_detail')),
  ('activity-003', 'customer-001', 'inquiry_sent', 'prop-001', 15, JSON_OBJECT('message_length', 250));

-- Insert Customer Points
INSERT INTO customer_points (id, user_id, total_points, current_level, points_this_month) 
VALUES ('points-001', 'customer-001', 30, 'Bronze', 30);

-- Insert Sample Favorites
INSERT INTO favorites (id, user_id, property_id) 
VALUES 
  ('fav-001', 'customer-001', 'prop-002'),
  ('fav-002', 'customer-001', 'prop-003');

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- Properties with agent information
CREATE VIEW property_with_agent AS
SELECT 
  p.*,
  u.username as agent_username,
  u.first_name as agent_first_name,
  u.last_name as agent_last_name,
  u.phone as agent_phone,
  u.email as agent_email,
  w.name as wave_name,
  w.color as wave_color
FROM properties p
LEFT JOIN users u ON p.agent_id = u.id
LEFT JOIN waves w ON p.wave_id = w.id;

-- Property statistics
CREATE VIEW property_stats AS
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_properties,
  COUNT(CASE WHEN listing_type = 'sale' THEN 1 END) as for_sale,
  COUNT(CASE WHEN listing_type = 'rent' THEN 1 END) as for_rent,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price,
  COUNT(CASE WHEN is_featured = TRUE THEN 1 END) as featured_properties
FROM properties
WHERE status = 'active';

-- User activity summary
CREATE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.role,
  cp.total_points,
  cp.current_level,
  COUNT(ca.id) as total_activities,
  COUNT(f.id) as total_favorites,
  COUNT(CASE WHEN p.agent_id = u.id THEN 1 END) as properties_managed
FROM users u
LEFT JOIN customer_points cp ON u.id = cp.user_id
LEFT JOIN customer_activity ca ON u.id = ca.user_id
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN properties p ON u.id = p.agent_id
GROUP BY u.id, u.username, u.email, u.role, cp.total_points, cp.current_level;

-- =====================================================
-- Success Message
-- =====================================================

SELECT 'MapEstate Database Import Completed Successfully!' as Message;
SELECT COUNT(*) as TotalTables FROM information_schema.tables WHERE table_schema = 'mapestate';
SELECT CONCAT('Login: admin@mapestate.com / password (Username: admin)') as AdminCredentials;
SELECT CONCAT('Sample Agent: john@mapestate.com / password (Username: john_agent)') as AgentCredentials;
SELECT CONCAT('Sample Customer: sarah@example.com / password (Username: sarah_customer)') as CustomerCredentials;