-- MapEstate MySQL Database Schema (Compatible Version)
-- Import this file into phpMyAdmin or MySQL command line
-- This version excludes stored procedures to avoid MariaDB compatibility issues
-- 
-- Usage: 
--   1. Open phpMyAdmin (http://localhost/phpmyadmin)
--   2. Create database 'mapestate' 
--   3. Import this file
-- 
-- Or via MySQL command line:
--   mysql -u root -p mapestate < mapestate_mysql_simple.sql

-- =====================================================
-- Database Setup
-- =====================================================

-- Drop database if exists (optional - comment out if you want to keep existing data)
-- DROP DATABASE IF EXISTS mapestate;

-- Create database
CREATE DATABASE IF NOT EXISTS mapestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mapestate;

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

-- 2. Waves Table (created before properties due to foreign key)
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

-- Properties indexes (with prefix lengths for TEXT columns)
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city(100));
CREATE INDEX idx_properties_type ON properties(type(50));
CREATE INDEX idx_properties_listing_type ON properties(listing_type(10));
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_agent_id ON properties(agent_id);
CREATE INDEX idx_properties_wave_id ON properties(wave_id);

-- Other useful indexes
CREATE INDEX idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);
CREATE INDEX idx_customer_activity_user_id ON customer_activity(user_id);

-- =====================================================
-- Sample Data
-- =====================================================

-- Insert default admin user
INSERT INTO users (id, username, email, password, role, first_name, last_name, allowed_languages) 
VALUES (
  'admin-001', 
  'admin', 
  'admin@mapestate.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'super_admin', 
  'Admin', 
  'User',
  JSON_ARRAY('en', 'ar', 'kur')
);

-- Insert sample agent user
INSERT INTO users (id, username, email, password, role, first_name, last_name, phone, allowed_languages) 
VALUES (
  'agent-001', 
  'agent_user', 
  'agent@mapestate.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
  'user', 
  'John', 
  'Agent',
  '+964750123456',
  JSON_ARRAY('en', 'ar')
);

-- Insert sample wave
INSERT INTO waves (id, name, description, color, created_by) 
VALUES (
  'wave-001', 
  'Premium Properties', 
  'High-end properties for VIP customers',
  '#FFD700',
  'admin-001'
);

-- Insert sample currency rates
INSERT INTO currency_rates (id, from_currency, to_currency, rate, set_by) 
VALUES 
  ('rate-001', 'USD', 'IQD', 1310.00, 'admin-001'),
  ('rate-002', 'USD', 'EUR', 0.85, 'admin-001'),
  ('rate-003', 'USD', 'AED', 3.67, 'admin-001');

-- Insert sample properties
INSERT INTO properties (
  id, title, description, type, listing_type, price, currency,
  bedrooms, bathrooms, area, address, city, country,
  latitude, longitude, images, amenities, features,
  language, agent_id, contact_phone, views, is_featured
) VALUES 
(
  'prop-001',
  'Modern Villa in Erbil',
  'Stunning 4-bedroom villa with swimming pool and garden',
  'villa',
  'sale',
  450000.00,
  'USD',
  4,
  3,
  350,
  'Ankawa District, Villa Street 15',
  'Erbil',
  'Iraq',
  36.2381300,
  44.0088400,
  JSON_ARRAY('villa1.jpg', 'villa2.jpg', 'villa3.jpg'),
  JSON_ARRAY('Swimming Pool', 'Garden', 'Garage', 'Security'),
  JSON_ARRAY('Modern Design', 'Central Heating', 'Air Conditioning'),
  'en',
  'agent-001',
  '+964750123456',
  150,
  TRUE
),
(
  'prop-002',
  'Luxury Apartment Downtown',
  'Premium 2-bedroom apartment in city center',
  'apartment',
  'rent',
  1200.00,
  'USD',
  2,
  2,
  120,
  'Downtown Center, Building 5, Floor 8',
  'Erbil',
  'Iraq',
  36.1900000,
  44.0090000,
  JSON_ARRAY('apt1.jpg', 'apt2.jpg'),
  JSON_ARRAY('Elevator', 'Parking', 'Gym', 'Balcony'),
  JSON_ARRAY('City View', 'Furnished', 'High Floor'),
  'en',
  'agent-001',
  '+964750123456',
  85,
  FALSE
),
(
  'prop-003',
  'Family House with Garden',
  'Comfortable 3-bedroom house perfect for families',
  'house',
  'sale',
  280000.00,
  'USD',
  3,
  2,
  200,
  'Ainkawa, House Complex, Unit 12',
  'Erbil',
  'Iraq',
  36.2200000,
  44.0100000,
  JSON_ARRAY('house1.jpg', 'house2.jpg', 'house3.jpg'),
  JSON_ARRAY('Garden', 'Parking', 'Storage Room'),
  JSON_ARRAY('Quiet Area', 'Near Schools', 'Recently Renovated'),
  'en',
  'agent-001',
  '+964750123456',
  95,
  FALSE
);

-- Insert sample customer activity
INSERT INTO customer_activity (id, user_id, activity_type, property_id, points) 
VALUES 
  ('activity-001', 'agent-001', 'property_view', 'prop-001', 5),
  ('activity-002', 'agent-001', 'favorite_add', 'prop-002', 10);

-- Insert sample customer points
INSERT INTO customer_points (id, user_id, total_points, current_level, points_this_month) 
VALUES ('points-001', 'agent-001', 15, 'Bronze', 15);

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
  u.email as agent_email
FROM properties p
LEFT JOIN users u ON p.agent_id = u.id;

-- Property statistics view
CREATE VIEW property_stats AS
SELECT 
  COUNT(*) as total_properties,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_properties,
  COUNT(CASE WHEN listing_type = 'sale' THEN 1 END) as for_sale,
  COUNT(CASE WHEN listing_type = 'rent' THEN 1 END) as for_rent,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM properties;

-- =====================================================
-- Completion Message
-- =====================================================

SELECT 'MapEstate Database Schema Import Completed Successfully!' as Message;
SELECT COUNT(*) as TotalTables FROM information_schema.tables WHERE table_schema = 'mapestate';
SELECT 'Default admin login: admin@mapestate.com / password' as AdminLogin;