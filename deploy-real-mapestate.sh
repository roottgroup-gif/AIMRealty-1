#!/bin/bash

echo "🏠 Deploying Real MapEstate to VPS..."

# VPS Details
VPS_IP="72.60.134.44"
VPS_USER="root"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Creating deployment package...${NC}"

# Create deployment directory
mkdir -p mapestate-deployment
cd mapestate-deployment

# Copy essential files (excluding heavy files)
cp -r ../client ./client 2>/dev/null || true
cp -r ../server ./server 2>/dev/null || true  
cp -r ../shared ./shared 2>/dev/null || true
cp ../package.json ./package.json 2>/dev/null || true
cp ../package-lock.json ./package-lock.json 2>/dev/null || true
cp ../tsconfig.json ./tsconfig.json 2>/dev/null || true
cp ../tailwind.config.ts ./tailwind.config.ts 2>/dev/null || true
cp ../postcss.config.js ./postcss.config.js 2>/dev/null || true
cp ../components.json ./components.json 2>/dev/null || true
cp ../vite.config.ts ./vite.config.ts 2>/dev/null || true

# Remove heavy files
rm -rf client/node_modules server/node_modules node_modules 2>/dev/null
find . -name "*.log" -delete 2>/dev/null

echo -e "${GREEN}✅ Deployment package created${NC}"

echo -e "${YELLOW}Step 2: Package created in mapestate-deployment/${NC}"
echo "📦 Contents:"
ls -la

echo ""
echo -e "${YELLOW}📋 Next Steps - Run these commands on your VPS:${NC}"
echo ""
echo "1. Connect to your VPS:"
echo "   ssh root@72.60.134.44"
echo ""
echo "2. Run the deployment script below:"
echo ""

cat << 'VPSEOF'
#!/bin/bash
echo "🏠 Setting up Real MapEstate on VPS..."

# Stop any running processes
pkill node 2>/dev/null || true
pkill nginx 2>/dev/null || true

# Install dependencies
apt update -y
apt install -y mysql-server nginx git

# Setup MySQL
systemctl start mysql
systemctl enable mysql

# Create database and user
mysql -u root -e "CREATE DATABASE IF NOT EXISTS mapestate CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'mapestate'@'localhost' IDENTIFIED BY 'MapEstate2024!';"
mysql -u root -e "GRANT ALL PRIVILEGES ON mapestate.* TO 'mapestate'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# Create project directory
rm -rf /var/www/mapestate-real
mkdir -p /var/www/mapestate-real
cd /var/www/mapestate-real

# Create package.json
cat > package.json << 'EOF'
{
  "name": "mapestate-production",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "NODE_ENV=production node server/index.js",
    "preview": "vite preview"
  },
  "dependencies": {
    "express": "^4.21.2",
    "compression": "^1.8.1",
    "mysql2": "^3.15.0",
    "bcryptjs": "^3.0.2",
    "express-session": "^1.18.2",
    "express-rate-limit": "^8.1.0",
    "ws": "^8.18.0",
    "zod": "^3.24.2",
    "drizzle-orm": "^0.39.1",
    "drizzle-zod": "^0.7.0",
    "memorystore": "^1.6.7"
  },
  "devDependencies": {
    "@types/express": "4.17.21",
    "@types/node": "20.16.11",
    "typescript": "5.6.3",
    "tsx": "^4.19.1",
    "esbuild": "^0.25.0"
  }
}
EOF

# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install

# Create directory structure
mkdir -p server shared

# Create simplified server
cat > server/index.js << 'SERVEREOF'
import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import compression from 'compression';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: 'mapestate-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Database connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'mapestate',
  password: 'MapEstate2024!',
  database: 'mapestate',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database tables
async function initDatabase() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS properties (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        listingType TEXT NOT NULL,
        price DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        bedrooms INT,
        bathrooms INT,
        area INT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        images JSON,
        amenities JSON,
        status VARCHAR(16) DEFAULT 'active',
        language VARCHAR(3) DEFAULT 'en',
        contactPhone TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        username VARCHAR(191) NOT NULL UNIQUE,
        email VARCHAR(320) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        firstName TEXT,
        lastName TEXT,
        phone TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample data
    const [existingProperties] = await db.execute('SELECT COUNT(*) as count FROM properties');
    if (existingProperties[0].count === 0) {
      const sampleProperties = [
        {
          title: 'Modern Villa in Erbil',
          description: 'Luxurious 4-bedroom villa with garden and garage in prime location',
          type: 'villa',
          listingType: 'sale',
          price: 450000,
          bedrooms: 4,
          bathrooms: 3,
          area: 350,
          address: 'Ankawa District',
          city: 'Erbil',
          country: 'Iraq',
          contactPhone: '+964 750 123 4567',
          amenities: '["Garden", "Garage", "Swimming Pool", "Security"]'
        },
        {
          title: 'Luxury Apartment in Sulaymaniyah',
          description: 'Modern 3-bedroom apartment with city view and amenities',
          type: 'apartment',
          listingType: 'sale',
          price: 180000,
          bedrooms: 3,
          bathrooms: 2,
          area: 120,
          address: 'Saray District',
          city: 'Sulaymaniyah',
          country: 'Iraq',
          contactPhone: '+964 770 987 6543',
          amenities: '["City View", "Elevator", "Parking", "Balcony"]'
        },
        {
          title: 'Family House in Duhok',
          description: 'Comfortable family house perfect for rental investment',
          type: 'house',
          listingType: 'rent',
          price: 1200,
          bedrooms: 3,
          bathrooms: 2,
          area: 180,
          address: 'Nohad District',
          city: 'Duhok',
          country: 'Iraq',
          contactPhone: '+964 750 555 9999',
          amenities: '["Garden", "Parking", "Near School"]'
        },
        {
          title: 'Commercial Land in Erbil',
          description: 'Prime commercial land suitable for business development',
          type: 'land',
          listingType: 'sale',
          price: 800000,
          bedrooms: 0,
          bathrooms: 0,
          area: 1000,
          address: 'Industrial Zone',
          city: 'Erbil',
          country: 'Iraq',
          contactPhone: '+964 750 111 2222',
          amenities: '["Commercial Zone", "Road Access", "Utilities Ready"]'
        },
        {
          title: 'Penthouse Apartment with Terrace',
          description: 'Stunning penthouse with private terrace and panoramic city views',
          type: 'apartment',
          listingType: 'sale',
          price: 320000,
          bedrooms: 2,
          bathrooms: 2,
          area: 140,
          address: 'Dream City',
          city: 'Erbil',
          country: 'Iraq',
          contactPhone: '+964 770 888 7777',
          amenities: '["Terrace", "City View", "Luxury Finishes", "Gym"]'
        },
        {
          title: 'Traditional Kurdish House',
          description: 'Authentic Kurdish architecture house with modern amenities',
          type: 'house',
          listingType: 'rent',
          price: 800,
          bedrooms: 4,
          bathrooms: 2,
          area: 200,
          address: 'Old City',
          city: 'Sulaymaniyah',
          country: 'Iraq',
          contactPhone: '+964 750 444 3333',
          amenities: '["Traditional Design", "Garden", "Courtyard"]'
        }
      ];

      for (const property of sampleProperties) {
        await db.execute(
          `INSERT INTO properties (title, description, type, listingType, price, bedrooms, bathrooms, area, address, city, country, contactPhone, amenities) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [property.title, property.description, property.type, property.listingType, property.price, 
           property.bedrooms, property.bathrooms, property.area, property.address, property.city, 
           property.country, property.contactPhone, property.amenities]
        );
      }
      console.log('✅ Sample properties inserted');
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// API Routes
app.get('/api/properties', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM properties WHERE status = "active" ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

app.get('/api/properties/featured', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM properties WHERE status = "active" ORDER BY createdAt DESC LIMIT 6');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching featured properties:', error);
    res.status(500).json({ error: 'Failed to fetch featured properties' });
  }
});

app.get('/api/properties/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q, type, city, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM properties WHERE status = "active"';
    const params = [];

    if (q) {
      query += ' AND (title LIKE ? OR description LIKE ? OR address LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    if (city) {
      query += ' AND city LIKE ?';
      params.push(`%${city}%`);
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }

    query += ' ORDER BY createdAt DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ error: 'Failed to search properties' });
  }
});

// Serve static frontend
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MapEstate - AI-Powered Real Estate Finder | Kurdistan, Iraq</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
      .property-card {
        transition: all 0.3s ease;
      }
      .property-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      .gradient-text {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    </style>
</head>
<body class="bg-gray-50 font-sans">
    <!-- Header -->
    <header class="bg-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <h1 class="text-3xl font-bold gradient-text">
                    <i class="fas fa-map-marker-alt mr-2"></i>
                    MapEstate
                </h1>
                <div class="flex items-center space-x-4">
                    <div class="hidden md:flex space-x-6">
                        <a href="#" class="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
                        <a href="#properties" class="text-gray-700 hover:text-blue-600 transition-colors">Properties</a>
                        <a href="#about" class="text-gray-700 hover:text-blue-600 transition-colors">About</a>
                        <a href="#contact" class="text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
                    </div>
                    <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        <i class="fas fa-server mr-1"></i>
                        Live on VPS!
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
        <div class="container mx-auto px-4 text-center">
            <h2 class="text-5xl md:text-7xl font-bold mb-6">
                🏠 Find Your Perfect Home
            </h2>
            <p class="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
                Discover amazing properties in Kurdistan, Iraq with AI-powered search and expert guidance
            </p>
            <div class="bg-white rounded-xl p-8 max-w-5xl mx-auto shadow-2xl">
                <div class="flex flex-col md:flex-row gap-4">
                    <input 
                        type="text" 
                        id="searchInput"
                        placeholder="Search by location, property type..." 
                        class="flex-1 px-6 py-4 border-2 border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:outline-none text-lg"
                    >
                    <select 
                        id="propertyType"
                        class="px-6 py-4 border-2 border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:outline-none text-lg"
                    >
                        <option value="all">All Types</option>
                        <option value="house">Houses</option>
                        <option value="apartment">Apartments</option>
                        <option value="villa">Villas</option>
                        <option value="land">Land</option>
                    </select>
                    <button 
                        onclick="searchProperties()" 
                        class="bg-blue-600 text-white px-10 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg shadow-lg"
                    >
                        <i class="fas fa-search mr-2"></i>Search
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="bg-white py-16">
        <div class="container mx-auto px-4">
            <div class="grid md:grid-cols-4 gap-8 text-center">
                <div class="p-6">
                    <div class="text-5xl font-bold text-blue-600 mb-3" id="propertyCount">6+</div>
                    <div class="text-gray-600 text-lg">Properties Listed</div>
                </div>
                <div class="p-6">
                    <div class="text-5xl font-bold text-green-600 mb-3">3</div>
                    <div class="text-gray-600 text-lg">Cities Covered</div>
                </div>
                <div class="p-6">
                    <div class="text-5xl font-bold text-purple-600 mb-3">100+</div>
                    <div class="text-gray-600 text-lg">Happy Customers</div>
                </div>
                <div class="p-6">
                    <div class="text-5xl font-bold text-orange-600 mb-3">24/7</div>
                    <div class="text-gray-600 text-lg">Customer Support</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Properties Section -->
    <section id="properties" class="py-20 bg-gray-50">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h3 class="text-4xl font-bold mb-4 gradient-text">Featured Properties</h3>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                    Discover our hand-picked selection of premium properties across Kurdistan
                </p>
            </div>
            <div id="properties-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div class="text-center text-gray-500 col-span-full">
                    <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                    <div>Loading properties...</div>
                </div>
            </div>
            <div class="text-center mt-12">
                <button onclick="loadAllProperties()" class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                    <i class="fas fa-th mr-2"></i>View All Properties
                </button>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h3 class="text-4xl font-bold mb-4">Why Choose MapEstate?</h3>
                <p class="text-xl text-gray-600">Advanced technology meets real estate expertise</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="text-center p-8 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div class="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-robot text-white text-2xl"></i>
                    </div>
                    <h4 class="text-xl font-semibold mb-3">AI-Powered Search</h4>
                    <p class="text-gray-600">Smart recommendations based on your preferences and search history</p>
                </div>
                <div class="text-center p-8 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                    <div class="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-map text-white text-2xl"></i>
                    </div>
                    <h4 class="text-xl font-semibold mb-3">Interactive Maps</h4>
                    <p class="text-gray-600">Explore neighborhoods, schools, and amenities with detailed maps</p>
                </div>
                <div class="text-center p-8 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                    <div class="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-headset text-white text-2xl"></i>
                    </div>
                    <h4 class="text-xl font-semibold mb-3">Expert Support</h4>
                    <p class="text-gray-600">Professional agents ready to assist you 24/7</p>
                </div>
            </div>
        </div>
    </section>

    <!-- About Section -->
    <section id="about" class="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div class="container mx-auto px-4 text-center">
            <h3 class="text-4xl font-bold mb-8">About MapEstate</h3>
            <div class="max-w-4xl mx-auto">
                <p class="text-xl mb-6 opacity-90">
                    MapEstate is Kurdistan's premier AI-powered real estate platform, connecting buyers, sellers, and renters with the perfect properties. We leverage cutting-edge technology to make property discovery intelligent, efficient, and enjoyable.
                </p>
                <div class="grid md:grid-cols-3 gap-8 mt-12">
                    <div class="p-6">
                        <h4 class="text-2xl font-bold mb-3 text-blue-400">Our Vision</h4>
                        <p class="opacity-80">To revolutionize real estate discovery in Kurdistan through technology</p>
                    </div>
                    <div class="p-6">
                        <h4 class="text-2xl font-bold mb-3 text-green-400">Our Mission</h4>
                        <p class="opacity-80">Making property search simple, transparent, and accessible for everyone</p>
                    </div>
                    <div class="p-6">
                        <h4 class="text-2xl font-bold mb-3 text-purple-400">Our Values</h4>
                        <p class="opacity-80">Trust, innovation, and exceptional customer service in everything we do</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-20 bg-white">
        <div class="container mx-auto px-4">
            <div class="text-center mb-16">
                <h3 class="text-4xl font-bold mb-4">Get In Touch</h3>
                <p class="text-xl text-gray-600">Ready to find your perfect property? Contact us today!</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div class="text-center p-6 bg-blue-50 rounded-lg">
                    <div class="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-phone text-white text-xl"></i>
                    </div>
                    <h4 class="font-semibold mb-2">Call Us</h4>
                    <p class="text-gray-600">+964 750 123 4567</p>
                </div>
                <div class="text-center p-6 bg-green-50 rounded-lg">
                    <div class="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-envelope text-white text-xl"></i>
                    </div>
                    <h4 class="font-semibold mb-2">Email Us</h4>
                    <p class="text-gray-600">info@mapestate.com</p>
                </div>
                <div class="text-center p-6 bg-purple-50 rounded-lg">
                    <div class="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fab fa-whatsapp text-white text-xl"></i>
                    </div>
                    <h4 class="font-semibold mb-2">WhatsApp</h4>
                    <p class="text-gray-600">+964 770 987 6543</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
        <div class="container mx-auto px-4">
            <div class="text-center">
                <h4 class="text-3xl font-bold mb-4 gradient-text">MapEstate</h4>
                <p class="text-gray-400 mb-6 max-w-2xl mx-auto">
                    Your trusted partner in finding the perfect property in Kurdistan, Iraq. 
                    Powered by AI technology and backed by local expertise.
                </p>
                <div class="flex justify-center space-x-8 mb-8">
                    <a href="#" class="text-gray-400 hover:text-white text-2xl transition-colors">
                        <i class="fab fa-facebook"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white text-2xl transition-colors">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white text-2xl transition-colors">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="#" class="text-gray-400 hover:text-white text-2xl transition-colors">
                        <i class="fab fa-linkedin"></i>
                    </a>
                </div>
                <div class="bg-green-900 text-green-200 px-6 py-3 rounded-lg inline-block mb-6">
                    <i class="fas fa-check-circle mr-2"></i>
                    Successfully deployed on VPS: 72.60.134.44
                </div>
                <div class="border-t border-gray-700 pt-8">
                    <p class="text-gray-400">&copy; 2024 MapEstate. All rights reserved. | Real Estate Platform for Kurdistan, Iraq</p>
                </div>
            </div>
        </div>
    </footer>

    <script>
        let allProperties = [];
        let currentView = 'featured';

        // Load properties from API
        async function loadProperties(endpoint = '/api/properties/featured') {
            try {
                console.log('🔄 Loading properties from:', endpoint);
                const response = await fetch(endpoint);
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                const properties = await response.json();
                allProperties = properties;
                
                displayProperties(properties);
                
                // Update property count
                const countElement = document.getElementById('propertyCount');
                if (countElement) {
                    countElement.textContent = properties.length + '+';
                }
                
                console.log(\`✅ Loaded \${properties.length} properties successfully\`);
                
            } catch (error) {
                console.error('❌ Error loading properties:', error);
                const grid = document.getElementById('properties-grid');
                grid.innerHTML = \`
                    <div class="col-span-full text-center p-8 bg-red-50 rounded-lg border border-red-200">
                        <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                        <h3 class="text-lg font-semibold text-red-700 mb-2">Unable to Load Properties</h3>
                        <p class="text-red-600 mb-4">Error: \${error.message}</p>
                        <button onclick="loadProperties()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors">
                            <i class="fas fa-redo mr-2"></i>Try Again
                        </button>
                    </div>
                \`;
            }
        }

        function displayProperties(properties) {
            const grid = document.getElementById('properties-grid');
            
            if (!properties || properties.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No properties found.</div>';
                return;
            }
            
            grid.innerHTML = properties.map((property, index) => {
                const amenities = property.amenities ? JSON.parse(property.amenities) : [];
                const price = parseFloat(property.price);
                const isRent = property.listingType === 'rent';
                
                return \`
                    <div class="property-card bg-white rounded-xl shadow-lg overflow-hidden">
                        <div class="h-56 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
                            <i class="fas fa-home text-6xl text-white opacity-50"></i>
                            <div class="absolute top-4 left-4">
                                <span class="bg-\${isRent ? 'green' : 'blue'}-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    \${property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
                                </span>
                            </div>
                            <div class="absolute top-4 right-4">
                                <span class="bg-white text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                    \${property.type}
                                </span>
                            </div>
                        </div>
                        <div class="p-6">
                            <h4 class="text-xl font-bold mb-3 line-clamp-2">\${property.title}</h4>
                            <p class="text-gray-600 mb-3 flex items-center">
                                <i class="fas fa-map-marker-alt mr-2 text-red-500"></i>
                                \${property.address}, \${property.city}
                            </p>
                            <p class="text-gray-500 text-sm mb-4 line-clamp-2">\${property.description || 'Beautiful property in prime location'}</p>
                            
                            <div class="flex justify-between items-center mb-4">
                                <div class="text-3xl font-bold text-blue-600">
                                    $\${price.toLocaleString()}
                                    \${isRent ? '<span class="text-sm text-gray-500">/month</span>' : ''}
                                </div>
                                <div class="text-gray-500 text-sm">
                                    <i class="fas fa-expand mr-1"></i>\${property.area} sqm
                                </div>
                            </div>
                            
                            \${property.bedrooms > 0 ? \`
                            <div class="flex justify-between text-sm text-gray-600 mb-4">
                                <span><i class="fas fa-bed mr-1"></i>\${property.bedrooms} beds</span>
                                <span><i class="fas fa-bath mr-1"></i>\${property.bathrooms} baths</span>
                                <span><i class="fas fa-home mr-1"></i>\${property.type}</span>
                            </div>
                            \` : ''}
                            
                            \${amenities.length > 0 ? \`
                            <div class="mb-4">
                                <div class="flex flex-wrap gap-1">
                                    \${amenities.slice(0, 3).map(amenity => \`
                                        <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">\${amenity}</span>
                                    \`).join('')}
                                    \${amenities.length > 3 ? \`<span class="text-gray-400 text-xs">+\${amenities.length - 3} more</span>\` : ''}
                                </div>
                            </div>
                            \` : ''}
                            
                            <div class="flex space-x-2">
                                <button onclick="viewProperty('\${property.id}', '\${property.title.replace(/'/g, "\\\\'")}', \${price}, '\${property.city}', '\${property.contactPhone || "N/A"}')" 
                                        class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                                    <i class="fas fa-eye mr-2"></i>View Details
                                </button>
                                \${property.contactPhone ? \`
                                <button onclick="contactProperty('\${property.contactPhone}', '\${property.title.replace(/'/g, "\\\\'")}')" 
                                        class="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors">
                                    <i class="fab fa-whatsapp"></i>
                                </button>
                                \` : ''}
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        async function searchProperties() {
            const searchInput = document.getElementById('searchInput').value;
            const propertyType = document.getElementById('propertyType').value;
            
            let endpoint = '/api/properties';
            const params = new URLSearchParams();
            
            if (searchInput.trim()) {
                params.append('q', searchInput.trim());
            }
            
            if (propertyType && propertyType !== 'all') {
                params.append('type', propertyType);
            }
            
            if (params.toString()) {
                endpoint = '/api/search?' + params.toString();
            }
            
            currentView = 'search';
            await loadProperties(endpoint);
            
            // Scroll to results
            document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
        }

        async function loadAllProperties() {
            currentView = 'all';
            await loadProperties('/api/properties');
        }

        function viewProperty(id, title, price, city, phone) {
            const modal = \`
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeModal(event)">
                    <div class="bg-white rounded-xl max-w-2xl w-full p-8 relative" onclick="event.stopPropagation()">
                        <button onclick="closeModal()" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                        <div class="text-center">
                            <div class="mb-6">
                                <i class="fas fa-home text-6xl text-blue-500 mb-4"></i>
                                <h2 class="text-3xl font-bold mb-2">\${title}</h2>
                                <p class="text-gray-600"><i class="fas fa-map-marker-alt mr-2"></i>\${city}</p>
                            </div>
                            <div class="bg-blue-50 p-6 rounded-lg mb-6">
                                <div class="text-4xl font-bold text-blue-600 mb-2">$\${price.toLocaleString()}</div>
                                <p class="text-gray-600">Property ID: \${id}</p>
                            </div>
                            <div class="text-left space-y-4 mb-6">
                                <div class="flex justify-between">
                                    <span class="font-medium">Location:</span>
                                    <span>\${city}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-medium">Contact:</span>
                                    <span>\${phone}</span>
                                </div>
                            </div>
                            <div class="flex space-x-4">
                                <button onclick="closeModal()" class="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors">
                                    Close
                                </button>
                                \${phone !== 'N/A' ? \`
                                <button onclick="contactProperty('\${phone}', '\${title.replace(/'/g, "\\\\'")}'); closeModal();" class="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors">
                                    <i class="fab fa-whatsapp mr-2"></i>Contact
                                </button>
                                \` : \`
                                <button onclick="alert('Contact information not available for this property.'); closeModal();" class="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors">
                                    <i class="fas fa-info mr-2"></i>More Info
                                </button>
                                \`}
                            </div>
                        </div>
                    </div>
                </div>
            \`;
            
            document.body.insertAdjacentHTML('beforeend', modal);
        }

        function contactProperty(phone, title) {
            if (phone && phone !== 'N/A') {
                const message = encodeURIComponent(\`Hello, I'm interested in the property: \${title}\`);
                window.open(\`https://wa.me/\${phone.replace(/[^0-9]/g, '')}?text=\${message}\`, '_blank');
            } else {
                alert('Contact information is not available for this property.');
            }
        }

        function closeModal(event) {
            if (!event || event.target.classList.contains('bg-black')) {
                const modal = document.querySelector('.fixed.inset-0');
                if (modal) modal.remove();
            }
        }

        // Handle search on Enter key
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        searchProperties();
                    }
                });
            }
            
            // Load featured properties on page load
            console.log('🏠 MapEstate loading...');
            loadProperties();
        });
    </script>
</body>
</html>
  `);
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🏠 MapEstate Real Estate Platform running on port \${PORT}\`);
    console.log(\`✅ Visit: http://dailynewscrypto.net:\${PORT}\`);
    console.log(\`📊 API: http://dailynewscrypto.net:\${PORT}/api/properties\`);
    console.log(\`🔍 Search: http://dailynewscrypto.net:\${PORT}/api/search?q=villa\`);
    console.log('🚀 Full MapEstate platform is now live!');
  });
});
SERVEREOF

echo "✅ MapEstate Real Estate Platform Setup Complete!"
echo ""
echo "🚀 Starting the server..."
# Start the server on port 3000 (since port 80 might need sudo)
NODE_ENV=production node server/index.js &

echo ""
echo "🎉 MapEstate is now running!"
echo "🌐 Visit: http://dailynewscrypto.net:3000"
echo "📊 API: http://dailynewscrypto.net:3000/api/properties"
echo "🔍 Search: http://dailynewscrypto.net:3000/api/search"
echo ""
echo "📋 To run on port 80 (optional):"
echo "   sudo NODE_ENV=production node server/index.js"
echo ""
echo "📊 Database created with sample properties:"
echo "   - Modern Villa in Erbil"  
echo "   - Luxury Apartment in Sulaymaniyah"
echo "   - Family House in Duhok"
echo "   - Commercial Land in Erbil"
echo "   - Penthouse with Terrace"
echo "   - Traditional Kurdish House"
VPSEOF

echo ""
echo -e "${GREEN}✅ Deployment script ready!${NC}"
echo ""
echo -e "${YELLOW}📋 Copy and paste the script above into your VPS terminal${NC}"
echo -e "${YELLOW}🔧 This will create your complete MapEstate platform with:${NC}"
echo "   • MySQL database with sample properties"
echo "   • Real estate API with search functionality" 
echo "   • Responsive web interface"
echo "   • Property management system"
echo "   • Contact integration (WhatsApp)"
echo ""
echo -e "${GREEN}🌐 Your site will be available at: http://dailynewscrypto.net:3000${NC}"