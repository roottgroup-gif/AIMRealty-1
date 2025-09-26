-- MySQL Database Schema for Real Estate Application
-- Generated for MySQL hosting compatibility

-- Create Database (uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS real_estate_app;
-- USE real_estate_app;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
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

-- Waves Table (created before properties due to foreign key)
CREATE TABLE IF NOT EXISTS waves (
    id VARCHAR(36) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
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
    FOREIGN KEY (agent_id) REFERENCES users(id),
    FOREIGN KEY (wave_id) REFERENCES waves(id)
);

-- Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(36) PRIMARY KEY,
    property_id VARCHAR(36),
    user_id VARCHAR(36),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status VARCHAR(16) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    property_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Search History Table
CREATE TABLE IF NOT EXISTS search_history (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    query TEXT NOT NULL,
    filters JSON,
    results INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Customer Activity Table
CREATE TABLE IF NOT EXISTS customer_activity (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    activity_type TEXT NOT NULL,
    property_id VARCHAR(36),
    metadata JSON,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Customer Points Table
CREATE TABLE IF NOT EXISTS customer_points (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    total_points INT DEFAULT 0,
    current_level VARCHAR(20) DEFAULT 'Bronze',
    points_this_month INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
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
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Recommendations Table
CREATE TABLE IF NOT EXISTS user_recommendations (
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Property Similarity Table
CREATE TABLE IF NOT EXISTS property_similarity (
    id VARCHAR(36) PRIMARY KEY,
    property_id_1 VARCHAR(36) NOT NULL,
    property_id_2 VARCHAR(36) NOT NULL,
    similarity_score DECIMAL(3,2) NOT NULL,
    similarity_factors JSON,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id_1) REFERENCES properties(id),
    FOREIGN KEY (property_id_2) REFERENCES properties(id)
);

-- Recommendation Analytics Table
CREATE TABLE IF NOT EXISTS recommendation_analytics (
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
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Currency Rates Table
CREATE TABLE IF NOT EXISTS currency_rates (
    id VARCHAR(36) PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    to_currency TEXT NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    set_by VARCHAR(36),
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (set_by) REFERENCES users(id)
);

-- Client Locations Table
CREATE TABLE IF NOT EXISTS client_locations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy INT,
    source VARCHAR(32) DEFAULT 'map_button',
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Customer Wave Permissions Table
CREATE TABLE IF NOT EXISTS customer_wave_permissions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    wave_id VARCHAR(36) NOT NULL,
    max_properties INT NOT NULL DEFAULT 1,
    used_properties INT DEFAULT 0,
    granted_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (wave_id) REFERENCES waves(id),
    FOREIGN KEY (granted_by) REFERENCES users(id)
);

-- Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_wave_id ON properties(wave_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_user_id ON customer_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_activity_property_id ON customer_activity(property_id);

-- Sample Data Insert (Optional - you can remove this section if not needed)
-- Insert sample users
INSERT IGNORE INTO users (id, username, email, password, role, first_name, last_name, allowed_languages) VALUES
('user-1000', 'admin', 'admin@example.com', '$2b$10$dummy.hash.for.password123', 'admin', 'Admin', 'User', '["en", "ar", "kur"]'),
('user-1001', 'agent1', 'agent1@example.com', '$2b$10$dummy.hash.for.password123', 'user', 'John', 'Doe', '["en"]'),
('user-1002', 'agent2', 'agent2@example.com', '$2b$10$dummy.hash.for.password123', 'user', 'Jane', 'Smith', '["en", "ar"]');

-- Insert sample waves
INSERT IGNORE INTO waves (id, name, description, color, created_by) VALUES
('wave-1000', 'Premium Properties', 'High-end luxury properties', '#FF6B6B', 'user-1000'),
('wave-1001', 'Budget Friendly', 'Affordable housing options', '#4ECDC4', 'user-1000'),
('wave-1002', 'Commercial', 'Commercial real estate', '#45B7D1', 'user-1000');

-- Insert sample currency rates
INSERT IGNORE INTO currency_rates (id, from_currency, to_currency, rate, set_by) VALUES
('curr-1000', 'USD', 'IQD', 1310.00, 'user-1000'),
('curr-1001', 'USD', 'AED', 3.67, 'user-1000'),
('curr-1002', 'USD', 'EUR', 0.85, 'user-1000');