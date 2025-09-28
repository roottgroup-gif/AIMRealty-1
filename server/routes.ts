import type { Express, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import { StorageFactory } from "./storageFactory";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { 
  insertPropertySchema, updatePropertySchema, insertInquirySchema, insertFavoriteSchema, insertUserSchema,
  insertWaveSchema, insertCustomerWavePermissionSchema, insertCurrencyRateSchema, updateCurrencyRateSchema,
  insertClientLocationSchema
} from "@shared/schema";
import { extractPropertyIdentifier } from "@shared/slug-utils";
import { hashPassword, requireAuth, requireRole, requireAnyRole, populateUser, validateLanguagePermission } from "./auth";
import session from "express-session";
import { z } from "zod";
import sitemapRouter from "./routes/sitemap";
import { registerPerformanceRoutes } from "./routes/performance";
import { 
  authRateLimit, searchRateLimit, apiRateLimit, adminRateLimit, 
  heavyOperationRateLimit, uploadRateLimit 
} from "./middleware/rateLimiting";
import { 
  cacheControl, handleConditionalRequest, trackQueryPerformance,
  performanceMonitor 
} from "./middleware/performance";

// SSE client management
const sseClients = new Set<Response>();

function broadcastToSSEClients(event: string, data: any) {
  // Structure payload to avoid property type field overwriting event type
  const payload = { 
    eventType: event,
    data: data
  };
  
  // Send both custom event and default message for maximum compatibility
  const customEventMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const defaultMessage = `data: ${JSON.stringify(payload)}\n\n`;
  
  console.log(`📡 Broadcasting ${event} to ${sseClients.size} connected clients:`, data.title || data.id);
  
  // Send to all connected clients
  sseClients.forEach(client => {
    try {
      // Send both formats to ensure compatibility
      client.write(customEventMessage);
      client.write(defaultMessage);
    } catch (error) {
      console.error(`❌ Failed to send ${event} to client:`, error);
      // Remove disconnected clients
      sseClients.delete(client);
    }
  });
}

import type { IStorage } from "./storage";

export async function registerRoutes(app: Express, storageInstance?: IStorage): Promise<Server> {
  // Use provided storage or get from factory
  const storage = storageInstance || StorageFactory.getInstance();

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Add user to all requests
  app.use(populateUser);

  // SEO routes
  app.use(sitemapRouter);

  // Performance monitoring routes
  registerPerformanceRoutes(app);

  // Authentication routes with rate limiting
  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Set session
      req.session.userId = user.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authRateLimit, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Wave balance information
  app.get("/api/auth/wave-balance", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const [currentUsage, remainingWaves] = await Promise.all([
        storage.getUserWaveUsage(userId),
        storage.getUserRemainingWaves(userId)
      ]);

      const user = await storage.getUser(userId);
      const totalBalance = user?.waveBalance || 0;

      res.json({
        totalBalance,
        currentUsage,
        remainingWaves,
        hasUnlimited: user?.role === 'admin' || user?.role === 'super_admin'
      });
    } catch (error) {
      console.error("Failed to get wave balance:", error);
      res.status(500).json({ message: "Failed to get wave balance" });
    }
  });

  // Multer configuration for file uploads
  const ALLOWED_UPLOAD_TYPES = {
    'avatar': path.join(__dirname, 'uploads', 'avatar'),
    'customer': path.join(__dirname, 'uploads', 'customer'), 
    'properties': path.join(__dirname, 'uploads', 'properties')
  } as const;

  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadType = req.params.type as string;
      const folderPath = ALLOWED_UPLOAD_TYPES[uploadType as keyof typeof ALLOWED_UPLOAD_TYPES];
      
      if (!folderPath) {
        return cb(new Error('Invalid upload type'), '');
      }
      
      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });

  const upload = multer({
    storage: storage_multer,
    limits: { 
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
      }
    }
  });

  // File upload endpoints
  app.post("/api/upload/:type", requireAuth, uploadRateLimit, upload.single('file'), async (req, res) => {
    try {
      const { type } = req.params;
      
      // Validate upload type
      if (!['avatar', 'customer', 'properties'].includes(type)) {
        return res.status(400).json({ message: "Invalid upload type. Use 'avatar', 'customer', or 'properties'" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileUrl = `/uploads/${type}/${req.file.filename}`;
      
      res.json({
        message: "File uploaded successfully",
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Serve static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Database initialization route (temporary for setup)
  app.post("/api/init-db", async (req, res) => {
    try {
      // Check if any users exist
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "Database already initialized" });
      }

      // Create admin user
      const hashedAdminPassword = await hashPassword("admin123");
      const admin = await storage.createUser({
        username: "admin",
        email: "admin@estateai.com",
        password: hashedAdminPassword,
        role: "super_admin",
        firstName: "System",
        lastName: "Admin",
        phone: "+964 750 000 0000",
        isVerified: true
      });

      // Create sample agent
      const hashedAgentPassword = await hashPassword("agent123");
      const agent = await storage.createUser({
        username: "john_agent",
        email: "john@estateai.com",
        password: hashedAgentPassword,
        role: "agent",
        firstName: "John",
        lastName: "Smith",
        phone: "+964 750 123 4567",
        isVerified: true
      });

      res.json({
        message: "Database initialized successfully",
        users: [
          { username: "admin", password: "admin123", role: "super_admin" },
          { username: "john_agent", password: "agent123", role: "agent" }
        ]
      });
    } catch (error) {
      console.error("Database initialization error:", error);
      res.status(500).json({ message: "Failed to initialize database" });
    }
  });

  // Admin routes with rate limiting
  app.get("/api/admin/users", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Clear all properties (admin only)
  app.delete("/api/admin/properties/all", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const count = await storage.clearAllProperties();
      
      // Broadcast to all SSE clients that properties were cleared
      broadcastToSSEClients('properties_cleared', { count });
      
      res.json({ 
        message: `Successfully deleted ${count} properties and related data`,
        deletedCount: count 
      });
    } catch (error) {
      console.error("Error clearing all properties:", error);
      res.status(500).json({ message: "Failed to clear all properties" });
    }
  });

  // Reset properties with new multilingual data (admin only)
  app.post("/api/admin/properties/reset", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      // First clear all existing properties
      const deletedCount = await storage.clearAllProperties();
      
      // Define multilingual property data (3 per language: en, ar, kur)
      const multilingualProperties = [
        // English Properties
        {
          title: "Luxury Villa in Erbil Center",
          description: "A stunning luxury villa located in the heart of Erbil with modern amenities and spacious rooms. Perfect for families seeking comfort and elegance in a prime location.",
          type: "villa" as const,
          listingType: "sale" as const,
          price: "450000",
          currency: "USD" as const,
          bedrooms: 5,
          bathrooms: 4,
          area: 350,
          address: "Central District, Erbil",
          city: "Erbil",
          country: "Iraq",
          latitude: "36.1911",
          longitude: "44.0092",
          amenities: ["Swimming Pool", "Garden", "Garage", "Security System"],
          features: ["Modern Kitchen", "Master Suite", "Balcony", "Central AC"],
          language: "en" as const,
          status: "active" as const,
          isFeatured: true,
          images: []
        },
        {
          title: "Modern Apartment in Ankawa",
          description: "Contemporary apartment in the vibrant Ankawa district, featuring modern design and convenient access to restaurants, shopping, and entertainment venues.",
          type: "apartment" as const,
          listingType: "rent" as const,
          price: "800",
          currency: "USD" as const,
          bedrooms: 2,
          bathrooms: 2,
          area: 120,
          address: "Ankawa District, Erbil",
          city: "Erbil", 
          country: "Iraq",
          latitude: "36.2381",
          longitude: "44.0092",
          amenities: ["Parking", "Elevator", "Balcony"],
          features: ["Open Plan", "Modern Fixtures", "City View"],
          language: "en" as const,
          status: "active" as const,
          isFeatured: false,
          images: []
        },
        {
          title: "Commercial Office Space",
          description: "Prime commercial office space in Erbil's business district, ideal for companies and startups. Features modern infrastructure and excellent connectivity.",
          type: "commercial" as const,
          listingType: "rent" as const,
          price: "1200",
          currency: "USD" as const,
          bedrooms: 0,
          bathrooms: 2,
          area: 200,
          address: "Business District, Erbil",
          city: "Erbil",
          country: "Iraq", 
          latitude: "36.1776",
          longitude: "44.0094",
          amenities: ["Parking", "Security", "Meeting Rooms"],
          features: ["High-Speed Internet", "Conference Room", "Reception Area"],
          language: "en" as const,
          status: "active" as const,
          isFeatured: false,
          images: []
        },
        // Arabic Properties
        {
          title: "فيلا فاخرة في مركز أربيل",
          description: "فيلا فاخرة مذهلة تقع في قلب أربيل مع وسائل الراحة الحديثة والغرف الواسعة. مثالية للعائلات التي تسعى للراحة والأناقة في موقع متميز.",
          type: "villa" as const,
          listingType: "sale" as const,
          price: "420000",
          currency: "USD" as const,
          bedrooms: 4,
          bathrooms: 3,
          area: 300,
          address: "المنطقة المركزية، أربيل",
          city: "أربيل",
          country: "العراق",
          latitude: "36.1950",
          longitude: "44.0050",
          amenities: ["حمام سباحة", "حديقة", "كراج", "نظام أمني"],
          features: ["مطبخ حديث", "جناح رئيسي", "شرفة", "تكييف مركزي"],
          language: "ar" as const,
          status: "active" as const,
          isFeatured: true,
          images: []
        },
        {
          title: "شقة حديثة في عنكاوا",
          description: "شقة عصرية في منطقة عنكاوا النابضة بالحياة، تتميز بالتصميم الحديث والوصول المريح للمطاعم والتسوق وأماكن الترفيه.",
          type: "apartment" as const,
          listingType: "rent" as const,
          price: "750",
          currency: "USD" as const,
          bedrooms: 3,
          bathrooms: 2,
          area: 140,
          address: "منطقة عنكاوا، أربيل",
          city: "أربيل",
          country: "العراق",
          latitude: "36.2400",
          longitude: "44.0080",
          amenities: ["موقف سيارات", "مصعد", "شرفة"],
          features: ["مخطط مفتوح", "تجهيزات حديثة", "إطلالة على المدينة"],
          language: "ar" as const,
          status: "active" as const,
          isFeatured: false,
          images: []
        },
        {
          title: "مساحة مكتبية تجارية",
          description: "مساحة مكتبية تجارية متميزة في المنطقة التجارية بأربيل، مثالية للشركات والشركات الناشئة. تتميز بالبنية التحتية الحديثة والاتصال الممتاز.",
          type: "commercial" as const,
          listingType: "rent" as const,
          price: "1100",
          currency: "USD" as const,
          bedrooms: 0,
          bathrooms: 1,
          area: 180,
          address: "المنطقة التجارية، أربيل",
          city: "أربيل",
          country: "العراق",
          latitude: "36.1800",
          longitude: "44.0100",
          amenities: ["موقف سيارات", "أمن", "قاعات اجتماعات"],
          features: ["إنترنت عالي السرعة", "قاعة مؤتمرات", "منطقة استقبال"],
          language: "ar" as const,
          status: "active" as const,
          isFeatured: false,
          images: []
        },
        // Kurdish Properties  
        {
          title: "ڤیلای فاخر لە ناوەندی هەولێر",
          description: "ڤیلایەکی فاخر و جوان لە دڵی شاری هەولێر، خاوەنی ئامرازە نوێکان و ژووری فراوان. تەواو گونجاوە بۆ خێزانەکان کە بەدوای ئاسوودەیی و جوانی دەگەڕێن.",
          type: "villa" as const,
          listingType: "sale" as const,
          price: "380000",
          currency: "USD" as const,
          bedrooms: 4,
          bathrooms: 3,
          area: 280,
          address: "ناوچەی ناوەند، هەولێر",
          city: "هەولێر",
          country: "عێراق",
          latitude: "36.1930",
          longitude: "44.0070",
          amenities: ["حەوزی مەلەکردن", "باخچە", "گاراج", "سیستەمی ئاسایش"],
          features: ["چێشتخانەی نوێ", "ژووری سەرەکی", "بەرەوپێش", "ئەیری ناوەند"],
          language: "kur" as const,
          status: "active" as const,
          isFeatured: true,
          images: []
        },
        {
          title: "شوقەی نوێ لە عەنکاوا",
          description: "شوقەیەکی هاوچەرخ لە ناوچەی بژووی عەنکاوا، خاوەنی دیزاینی نوێ و دەستگەیشتنی ئاسان بۆ چێشتخانە، بازاڕ و شوێنەکانی خۆشی.",
          type: "apartment" as const,
          listingType: "rent" as const,
          price: "700",
          currency: "USD" as const,
          bedrooms: 2,
          bathrooms: 1,
          area: 100,
          address: "ناوچەی عەنکاوا، هەولێر",
          city: "هەولێر",
          country: "عێراق",
          latitude: "36.2350",
          longitude: "44.0060",
          amenities: ["پارکینگ", "ئاسانسۆر", "بەرەوپێش"],
          features: ["نەخشەی کراوە", "ئامرازی نوێ", "بینینی شار"],
          language: "kur" as const,
          status: "active" as const,
          isFeatured: false,
          images: []
        },
        {
          title: "شوێنی کاری بازرگانی",
          description: "شوێنی کاری بازرگانی باش لە ناوچەی بازرگانی هەولێر، گونجاو بۆ کۆمپانیاکان و کۆمپانیا نوێکان. خاوەنی بنیاتی نوێ و پەیوەندی باشە.",
          type: "commercial" as const,
          listingType: "rent" as const,
          price: "1000",
          currency: "USD" as const,
          bedrooms: 0,
          bathrooms: 1,
          area: 150,
          address: "ناوچەی بازرگانی، هەولێر",
          city: "هەولێر",
          country: "عێراق",
          latitude: "36.1750",
          longitude: "44.0110",
          amenities: ["پارکینگ", "ئاسایش", "ژووری کۆبوونەوە"],
          features: ["ئینتەرنێتی خێرا", "ژووری کۆنفرانس", "ناوچەی پێشوازی"],
          language: "kur" as const,
          status: "active" as const,
          isFeatured: false,
          images: []
        }
      ];

      // Insert new properties
      const insertedProperties = [];
      const counts = { en: 0, ar: 0, kur: 0 };
      
      for (const propertyData of multilingualProperties) {
        try {
          const property = await storage.createProperty(propertyData);
          insertedProperties.push(property);
          counts[propertyData.language]++;
        } catch (error) {
          console.error(`Failed to create property: ${propertyData.title}`, error);
        }
      }

      // Broadcast to all SSE clients about the reset
      broadcastToSSEClients('properties_reset', { 
        deletedCount, 
        insertedCount: insertedProperties.length,
        languageCounts: counts 
      });

      res.status(201).json({
        message: `Successfully reset properties. Deleted ${deletedCount}, inserted ${insertedProperties.length} new properties.`,
        deletedCount,
        insertedCount: insertedProperties.length,
        languageCounts: counts,
        properties: insertedProperties
      });

    } catch (error) {
      console.error("Error resetting properties:", error);
      res.status(500).json({ message: "Failed to reset properties" });
    }
  });

  // Admin and super admin - get users with passwords
  app.get("/api/admin/users/with-passwords", requireRole("admin"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Admin and super admin can see passwords
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users with passwords" });
    }
  });

  app.post("/api/admin/users", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      console.log('🔍 DEBUG: Raw request body:', JSON.stringify(req.body, null, 2));
      console.log('🔍 DEBUG: User role:', req.user?.role);
      
      // Preprocess the request body to handle date conversion
      const processedBody = { ...req.body };
      
      // Convert expiresAt string to Date if provided and not empty
      if (processedBody.expiresAt) {
        if (typeof processedBody.expiresAt === 'string' && processedBody.expiresAt.trim() !== '') {
          const dateObj = new Date(processedBody.expiresAt);
          if (!isNaN(dateObj.getTime())) {
            processedBody.expiresAt = dateObj;
          } else {
            delete processedBody.expiresAt;
          }
        } else {
          delete processedBody.expiresAt;
        }
      }

      // Only super admins can set language permissions for other users
      if (processedBody.allowedLanguages && req.user?.role !== 'super_admin') {
        return res.status(403).json({ 
          message: "Only super admins can set language permissions" 
        });
      }

      // Set default language permissions if not provided and user is super admin
      if (!processedBody.allowedLanguages && req.user?.role === 'super_admin') {
        processedBody.allowedLanguages = ['en']; // Default to English only
      }
      
      console.log('🔍 DEBUG: Processed body before validation (avatar truncated):', {
        ...processedBody,
        avatar: processedBody.avatar ? `[Base64 image ${processedBody.avatar.length} chars]` : undefined
      });
      
      const validatedData = insertUserSchema.parse(processedBody);
      
      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Preprocess the request body to handle date conversion
      const processedBody = { ...req.body };
      
      // Convert expiresAt string to Date if provided and not empty
      if (processedBody.expiresAt) {
        if (typeof processedBody.expiresAt === 'string' && processedBody.expiresAt.trim() !== '') {
          const dateObj = new Date(processedBody.expiresAt);
          if (!isNaN(dateObj.getTime())) {
            processedBody.expiresAt = dateObj;
          } else {
            delete processedBody.expiresAt;
          }
        } else {
          delete processedBody.expiresAt;
        }
      }

      // Only super admins can modify language permissions
      if (processedBody.allowedLanguages && req.user?.role !== 'super_admin') {
        return res.status(403).json({ 
          message: "Only super admins can modify language permissions" 
        });
      }
      
      const validatedData = insertUserSchema.partial().parse(processedBody);
      
      // Hash password if provided
      if (validatedData.password) {
        validatedData.password = await hashPassword(validatedData.password);
      }
      
      const updatedUser = await storage.updateUser(id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update wave balance for customers with 0 balance
  app.post("/api/admin/update-customer-wave-balance", requireRole("admin"), async (req, res) => {
    try {
      const updatedCount = await storage.updateUsersWithZeroWaveBalance();
      res.json({ 
        message: `Updated wave balance for ${updatedCount} customers`, 
        updatedCount 
      });
    } catch (error) {
      console.error("Update wave balance error:", error);
      res.status(500).json({ message: "Failed to update customer wave balances" });
    }
  });

  // Set specific wave balance for a customer
  app.put("/api/admin/users/:id/wave-balance", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { waveBalance } = req.body;

      if (typeof waveBalance !== 'number' || waveBalance < 0) {
        return res.status(400).json({ message: "Wave balance must be a non-negative number" });
      }

      const updatedUser = await storage.updateUser(id, { waveBalance });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Set wave balance error:", error);
      res.status(500).json({ message: "Failed to set customer wave balance" });
    }
  });

  // Currency rate management routes (admin and super admin)
  app.get("/api/admin/currency-rates", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const rates = await storage.getCurrencyRates();
      res.json(rates);
    } catch (error) {
      console.error("Get currency rates error:", error);
      res.status(500).json({ message: "Failed to fetch currency rates" });
    }
  });

  app.get("/api/admin/currency-rates/active", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const rates = await storage.getActiveCurrencyRates();
      res.json(rates);
    } catch (error) {
      console.error("Get active currency rates error:", error);
      res.status(500).json({ message: "Failed to fetch active currency rates" });
    }
  });

  app.post("/api/admin/currency-rates", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertCurrencyRateSchema.parse({
        ...req.body,
        setBy: req.user?.id || 'unknown'
      });
      
      const newRate = await storage.createCurrencyRate(validatedData);
      res.status(201).json(newRate);
    } catch (error) {
      console.error("Create currency rate error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid currency rate data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create currency rate" });
    }
  });

  app.put("/api/admin/currency-rates/:id", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateCurrencyRateSchema.parse(req.body);
      
      const updatedRate = await storage.updateCurrencyRate(id, validatedData);
      
      if (!updatedRate) {
        return res.status(404).json({ message: "Currency rate not found" });
      }
      
      res.json(updatedRate);
    } catch (error) {
      console.error("Update currency rate error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid currency rate data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update currency rate" });
    }
  });

  app.delete("/api/admin/currency-rates/:id", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deactivateCurrencyRate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Currency rate not found" });
      }
      
      res.json({ message: "Currency rate deactivated successfully" });
    } catch (error) {
      console.error("Deactivate currency rate error:", error);
      res.status(500).json({ message: "Failed to deactivate currency rate" });
    }
  });

  // Client location tracking routes
  // Public route for creating client locations (when users click location button)
  app.post("/api/client-locations", apiRateLimit, async (req, res) => {
    try {
      const validatedData = insertClientLocationSchema.parse({
        ...req.body,
        userId: req.user?.id || null // Include user ID if logged in, otherwise null for anonymous tracking
      });
      
      const location = await storage.createClientLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Create client location error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid location data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to record client location" });
    }
  });

  // Admin route for retrieving client location data
  app.get("/api/admin/client-locations", adminRateLimit, requireAnyRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const { userId, from, to, limit, offset } = req.query;
      
      // Validate and sanitize parameters
      const params = {
        userId: userId ? String(userId) : undefined,
        from: undefined as string | undefined,
        to: undefined as string | undefined,
        limit: undefined as number | undefined,
        offset: undefined as number | undefined,
      };

      // Validate date strings
      if (from) {
        const fromDate = new Date(String(from));
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ message: "Invalid 'from' date format. Use ISO 8601 format." });
        }
        params.from = String(from);
      }

      if (to) {
        const toDate = new Date(String(to));
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ message: "Invalid 'to' date format. Use ISO 8601 format." });
        }
        params.to = String(to);
      }

      // Validate and clamp limit
      if (limit) {
        const limitNum = parseInt(String(limit));
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 200) {
          return res.status(400).json({ message: "Limit must be between 1 and 200." });
        }
        params.limit = limitNum;
      }

      // Validate offset
      if (offset) {
        const offsetNum = parseInt(String(offset));
        if (isNaN(offsetNum) || offsetNum < 0) {
          return res.status(400).json({ message: "Offset must be 0 or greater." });
        }
        params.offset = offsetNum;
      } else {
        params.offset = 0;
      }

      const [locations, total] = await Promise.all([
        storage.getClientLocations(params),
        storage.countClientLocations({ 
          userId: params.userId, 
          from: params.from, 
          to: params.to 
        })
      ]);

      res.json({
        items: locations,
        total,
        limit: params.limit || null,
        offset: params.offset || 0
      });
    } catch (error) {
      console.error("Get client locations error:", error);
      res.status(500).json({ message: "Failed to fetch client locations" });
    }
  });

  // Admin route for client location analytics/stats
  app.get("/api/admin/client-locations/stats", adminRateLimit, requireAnyRole(["admin", "super_admin"]), async (req, res) => {
    try {
      const { from, to } = req.query;
      
      // Validate dates
      const params: { from?: string; to?: string } = {};
      if (from) {
        const fromDate = new Date(String(from));
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ message: "Invalid 'from' date format. Use ISO 8601 format." });
        }
        params.from = String(from);
      }

      if (to) {
        const toDate = new Date(String(to));
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ message: "Invalid 'to' date format. Use ISO 8601 format." });
        }
        params.to = String(to);
      }

      const stats = await storage.getClientLocationStats();
      res.json(stats);
    } catch (error) {
      console.error("Get client location stats error:", error);
      res.status(500).json({ message: "Failed to fetch client location stats" });
    }
  });

  // Public currency conversion endpoint
  app.get("/api/currency/convert", apiRateLimit, async (req, res) => {
    try {
      const { amount, from, to } = req.query;
      
      if (!amount || !from || !to) {
        return res.status(400).json({ 
          message: "Missing required parameters: amount, from, to" 
        });
      }
      
      const numAmount = parseFloat(amount as string);
      if (isNaN(numAmount)) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const convertedAmount = await storage.convertPrice(numAmount, from as string, to as string);
      
      res.json({
        originalAmount: numAmount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Currency conversion error:", error);
      res.status(500).json({ message: "Failed to convert currency" });
    }
  });

  // Customer profile update route (users can update their own profile)
  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      
      // Allow only specific fields to be updated by customers
      const allowedFields = ['firstName', 'lastName', 'phone', 'avatar'];
      const updateData: any = {};
      
      // Filter only allowed fields from request body
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key) && req.body[key] !== undefined) {
          updateData[key] = req.body[key];
        }
      });
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Properties routes with caching and optimization
  app.get("/api/properties", 
    apiRateLimit,
    cacheControl({ maxAge: 0 }), // No caching for real-time updates
    async (req, res) => {
    try {
      const {
        type,
        listingType,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        city,
        country,
        language,
        search,
        sortBy,
        sortOrder,
        limit = "20",
        offset = "0"
      } = req.query;

      const filters = {
        type: type as string,
        listingType: listingType as "sale" | "rent",
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        bedrooms: bedrooms ? parseInt(bedrooms as string) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms as string) : undefined,
        city: city as string,
        country: country as string,
        language: language as "en" | "ar" | "kur",
        search: search as string,
        sortBy: sortBy as "price" | "date" | "views",
        sortOrder: sortOrder as "asc" | "desc",
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const properties = await storage.getProperties(filters);
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/featured", 
    cacheControl({ maxAge: 600 }), // Cache for 10 minutes
    async (req, res) => {
    try {
      const properties = await storage.getFeaturedProperties();
      
      // Handle conditional requests for caching (with error handling)
      try {
        if (handleConditionalRequest(req, res, properties)) {
          return;
        }
      } catch (error) {
        console.warn('Conditional request handling failed:', error);
      }
      
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured properties" });
    }
  });

  // SSE stream for real-time property updates
  app.get("/api/properties/stream", (req, res) => {
    console.log('🔌 New SSE connection established');
    
    // Set SSE headers with anti-buffering measures
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Keep-Alive': 'timeout=60, max=1000',
      'Content-Encoding': 'identity',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no' // Prevent buffering by Nginx
    });

    // Flush headers to prevent intermediary buffering
    res.flushHeaders();

    // Send 2KB padding to force streaming start (prevents proxy buffering)
    res.write(':' + ' '.repeat(2048) + '\n');
    res.write('retry: 10000\n\n');
    if (res.flush) res.flush();
    console.log('📡 SSE padding sent, forcing stream start');

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connection established' })}\n\n`);
    if (res.flush) res.flush();
    console.log('📡 SSE initial connection message sent and flushed');

    // Add client to SSE clients set
    sseClients.add(res);
    console.log(`📊 SSE clients connected: ${sseClients.size}`);

    // Set up heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`;
        res.write(heartbeatData);
        if (res.flush) res.flush();
        console.log('💓 SSE heartbeat sent and flushed');
      } catch (error) {
        console.log('💔 SSE heartbeat failed, removing client:', (error as Error).message);
        clearInterval(heartbeat);
        sseClients.delete(res);
        console.log(`📊 SSE clients connected: ${sseClients.size}`);
      }
    }, 15000); // Send heartbeat every 15 seconds

    // Handle client disconnect
    req.on('close', () => {
      console.log('🔌 SSE client disconnected (close)');
      clearInterval(heartbeat);
      sseClients.delete(res);
      console.log(`📊 SSE clients connected: ${sseClients.size}`);
    });

    req.on('error', (error) => {
      console.log('🔌 SSE client disconnected (error):', error.message);
      clearInterval(heartbeat);
      sseClients.delete(res);
      console.log(`📊 SSE clients connected: ${sseClients.size}`);
    });
  });

  app.get("/api/properties/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      console.log(`🔍 Fetching property with ID or slug: ${idOrSlug}`);
      
      // Implement fallback mechanism: try slug first, then ID
      let property = await storage.getPropertyBySlug(idOrSlug);
      
      if (!property) {
        console.log(`🔄 Slug lookup failed, trying ID lookup for: ${idOrSlug}`);
        property = await storage.getProperty(idOrSlug);
      }
      
      if (!property) {
        console.log(`❌ Property not found with slug or ID: ${idOrSlug}`);
        return res.status(404).json({ message: "Property not found" });
      }

      // Increment views using the property ID
      await storage.incrementPropertyViews(property.id);
      
      console.log(`✅ Property found: ${property.title}`);
      res.json(property);
    } catch (error) {
      console.error('Error fetching property:', error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", requireAnyRole(["user", "admin"]), validateLanguagePermission, async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      
      // Extract images, amenities, and features from the validated request body
      const { images = [], amenities = [], features = [] } = req.body;
      
      // Create property with validated data and associated arrays
      const property = await storage.createProperty(
        validatedData, 
        images, 
        amenities, 
        features
      );
      
      // Broadcast new property to all SSE clients
      broadcastToSSEClients('property_created', property);
      
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      console.error('Error creating property:', error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", requireAnyRole(["user", "admin"]), validateLanguagePermission, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Preprocess request body to handle null images
      const processedBody = { ...req.body };
      if (processedBody.images === null) {
        processedBody.images = undefined;
      }
      
      const validatedData = updatePropertySchema.parse(processedBody);
      const property = await storage.updateProperty(id, validatedData);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Broadcast updated property to all SSE clients
      broadcastToSSEClients('property_updated', property);
      
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", requireAnyRole(["user", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the property first to check ownership
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if user owns the property or is admin
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Allow deletion if user is admin or owns the property
      if (user.role !== 'admin' && user.role !== 'super_admin' && property.agentId !== user.id) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own properties" });
      }
      
      const deleted = await storage.deleteProperty(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Broadcast property deletion to all SSE clients
      broadcastToSSEClients('property_deleted', { id, title: property.title });
      
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Delete individual property image
  app.delete("/api/properties/:propertyId/images", requireAnyRole(["agent", "admin", "super_admin"]), async (req, res) => {
    try {
      const { propertyId } = req.params;
      
      // Validate request body with Zod
      const imageDeleteSchema = z.object({
        imageUrl: z.string().min(1, "Image URL is required")
      });
      
      const validatedData = imageDeleteSchema.parse(req.body);
      const { imageUrl } = validatedData;
      
      // Get the property first to check ownership
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Check if user owns the property or is admin
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Allow deletion if user is admin/super_admin or owns the property
      if (user.role !== 'admin' && user.role !== 'super_admin' && property.agentId !== user.id) {
        return res.status(403).json({ message: "Forbidden: You can only modify your own properties" });
      }
      
      // Remove the specific image with automatic resequencing (handled atomically in storage)
      const result = await storage.removePropertyImageWithResequencing(propertyId, imageUrl);
      
      if (!result.success) {
        return res.status(404).json({ message: "Image not found or already removed" });
      }
      
      // Broadcast property update to all SSE clients
      broadcastToSSEClients('property_updated', { id: propertyId, title: property.title });
      
      res.json({ 
        message: "Image deleted successfully",
        remainingImages: result.remainingCount
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error('Failed to delete property image:', error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  // User's own properties
  app.get("/api/users/:userId/properties", async (req, res) => {
    try {
      const { userId } = req.params;
      // Get all properties and filter by agentId since we removed getPropertiesByAgent
      const allProperties = await storage.getProperties();
      const properties = allProperties.filter(p => p.agentId === userId);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user properties" });
    }
  });

  // Inquiries routes
  app.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });

  app.get("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const inquiries = await storage.getInquiriesForProperty(propertyId);
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });


  app.put("/api/inquiries/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["pending", "replied", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const inquiry = await storage.updateInquiryStatus(id, status);
      
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      res.json(inquiry);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inquiry status" });
    }
  });

  // Favorites routes
  app.get("/api/users/:userId/favorites", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getFavoritesByUser(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse(req.body);
      const favorite = await storage.addToFavorites(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  app.delete("/api/favorites", async (req, res) => {
    try {
      const { userId, propertyId } = req.body;
      
      if (!userId || !propertyId) {
        return res.status(400).json({ message: "userId and propertyId are required" });
      }
      
      const removed = await storage.removeFromFavorites(userId, propertyId);
      
      if (!removed) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  app.get("/api/favorites/check", async (req, res) => {
    try {
      const { userId, propertyId } = req.query;
      
      if (!userId || !propertyId) {
        return res.status(400).json({ message: "userId and propertyId are required" });
      }
      
      const isFavorite = await storage.isFavorite(userId as string, propertyId as string);
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // AI Search endpoint with rate limiting
  app.post("/api/search/ai", searchRateLimit, async (req, res) => {
    try {
      const { query, userId } = req.body;
      
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      // Basic AI search implementation - parse common patterns
      const searchTerms = query.toLowerCase();
      const filters: any = {};

      // Extract price range
      const priceMatch = searchTerms.match(/under\s+\$?([\d,]+)|below\s+\$?([\d,]+)|less\s+than\s+\$?([\d,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]?.replace(',', '') || priceMatch[2]?.replace(',', '') || priceMatch[3]?.replace(',', ''));
        filters.maxPrice = price;
      }

      // Extract bedrooms
      const bedroomMatch = searchTerms.match(/(\d+)\s*bed/);
      if (bedroomMatch) {
        filters.bedrooms = parseInt(bedroomMatch[1]);
      }

      // Extract property type
      if (searchTerms.includes('house')) filters.type = 'house';
      if (searchTerms.includes('apartment')) filters.type = 'apartment';
      if (searchTerms.includes('villa')) filters.type = 'villa';

      // Extract listing type
      if (searchTerms.includes('rent')) filters.listingType = 'rent';
      if (searchTerms.includes('buy') || searchTerms.includes('sale')) filters.listingType = 'sale';

      // Extract location
      const locations = ['erbil', 'baghdad', 'sulaymaniyah', 'kurdistan', 'iraq'];
      for (const location of locations) {
        if (searchTerms.includes(location)) {
          filters.city = location;
          break;
        }
      }

      // Add general search term
      filters.search = query;

      const properties = await trackQueryPerformance(
        'getPropertiesForSearch',
        () => storage.getProperties(filters)
      );

      // Save search history if user is provided
      if (userId) {
        await storage.addSearchHistory({
          userId,
          query,
          results: properties.length,
        });
      }

      res.json({
        query,
        filters,
        results: properties,
        count: properties.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform AI search" });
    }
  });

  // Search suggestions
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const suggestions = [
        "Show me apartments under $150k in Erbil",
        "Find family homes with gardens near schools",
        "Luxury properties with mountain views",
        "3-bedroom houses under $200k",
        "Modern apartments for rent in Baghdad",
        "Villas with swimming pools in Kurdistan",
      ];
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Customer Analytics Routes
  app.post("/api/customers/:userId/activity", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { activityType, propertyId, metadata, points } = req.body;
      
      const activity = await storage.addCustomerActivity({
        userId,
        activityType,
        propertyId: propertyId || null,
        points: points || 0
      });
      
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to add customer activity" });
    }
  });

  app.get("/api/customers/:userId/activities", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const activities = await storage.getCustomerActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer activities" });
    }
  });

  app.get("/api/customers/:userId/points", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const points = await storage.getCustomerPoints(userId);
      
      if (!points) {
        return res.json({
          userId,
          totalPoints: 0,
          currentLevel: "Bronze",
          pointsThisMonth: 0,
          lastActivity: null
        });
      }
      
      res.json(points);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer points" });
    }
  });

  app.get("/api/customers/:userId/analytics", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const analytics = await storage.getCustomerAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer analytics" });
    }
  });

  app.put("/api/customers/:userId/points", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { totalPoints, currentLevel, pointsThisMonth } = req.body;
      
      const points = await storage.updateCustomerPoints(userId, {
        totalPoints,
        currentLevel,
        pointsThisMonth
      });
      
      res.json(points);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer points" });
    }
  });

  // Seed users endpoint
  app.post("/api/seed/users", async (req, res) => {
    try {
      // Check if users already exist
      const existingSuperAdmin = await storage.getUserByUsername("superadmin");
      const existingUser = await storage.getUserByUsername("john_doe");

      const createdUsers = [];

      if (!existingSuperAdmin) {
        // Create super admin
        const hashedPassword = await hashPassword("SuperAdmin123!");
        const superAdmin = await storage.createUser({
          username: "superadmin",
          email: "superadmin@estateai.com",
          password: hashedPassword,
          role: "super_admin",
          firstName: "Super",
          lastName: "Admin",
          phone: "+964-750-123-4567",
          isVerified: true
        });
        createdUsers.push({ username: superAdmin.username, role: superAdmin.role });
      } else {
        createdUsers.push({ username: "superadmin", role: "super_admin", status: "already_exists" });
      }

      if (!existingUser) {
        // Create regular user
        const hashedPassword = await hashPassword("User123!");
        const regularUser = await storage.createUser({
          username: "john_doe",
          email: "john.doe@example.com",
          password: hashedPassword,
          role: "user",
          firstName: "John",
          lastName: "Doe",
          phone: "+964-750-987-6543",
          isVerified: true
        });
        createdUsers.push({ username: regularUser.username, role: regularUser.role });
      } else {
        createdUsers.push({ username: "john_doe", role: "user", status: "already_exists" });
      }

      res.json({ 
        message: "Seed operation completed",
        users: createdUsers 
      });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed users" });
    }
  });

  // Wave Management Routes
  
  // Get all waves (for super admin and customers to see available waves)
  app.get("/api/waves", requireAuth, async (req, res) => {
    try {
      const waves = await storage.getWaves();
      res.json(waves);
    } catch (error) {
      console.error("Error fetching waves:", error);
      res.status(500).json({ message: "Failed to fetch waves" });
    }
  });

  // Create wave (super admin only)
  app.post("/api/waves", requireRole("super_admin"), async (req, res) => {
    try {
      const validatedData = insertWaveSchema.parse(req.body);
      const wave = await storage.createWave({
        ...validatedData,
        createdBy: req.session.userId!
      });
      res.status(201).json(wave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid wave data", errors: error.errors });
      }
      console.error("Error creating wave:", error);
      res.status(500).json({ message: "Failed to create wave" });
    }
  });

  // Update wave (super admin only)
  app.put("/api/waves/:id", requireRole("super_admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertWaveSchema.partial().parse(req.body);
      const wave = await storage.updateWave(id, validatedData);
      
      if (!wave) {
        return res.status(404).json({ message: "Wave not found" });
      }
      
      res.json(wave);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid wave data", errors: error.errors });
      }
      console.error("Error updating wave:", error);
      res.status(500).json({ message: "Failed to update wave" });
    }
  });

  // Delete wave (super admin only)
  app.delete("/api/waves/:id", requireRole("super_admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteWave(id);
      
      if (!success) {
        return res.status(404).json({ message: "Wave not found" });
      }
      
      res.json({ message: "Wave deleted successfully" });
    } catch (error) {
      console.error("Error deleting wave:", error);
      res.status(500).json({ message: "Failed to delete wave" });
    }
  });

  // Get customer wave permissions (for specific customer)
  app.get("/api/customers/:userId/wave-permissions", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await storage.getUser(req.session.userId!);
      
      // Users can only see their own permissions or admin can see all
      if (req.session.userId !== userId && currentUser?.role !== 'super_admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const permissions = await storage.getCustomerWavePermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching wave permissions:", error);
      res.status(500).json({ message: "Failed to fetch wave permissions" });
    }
  });

  // Grant wave permission to customer (super admin only)
  app.post("/api/customers/:userId/wave-permissions", requireRole("super_admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { waveId, maxProperties } = req.body;
      
      const permission = await storage.grantWavePermission({
        userId,
        waveId,
        maxProperties: maxProperties || 1,
        usedProperties: 0,
        grantedBy: req.session.userId!
      });
      
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error granting wave permission:", error);
      res.status(500).json({ message: "Failed to grant wave permission" });
    }
  });

  // Update wave permission (super admin only)
  app.put("/api/customers/:userId/wave-permissions/:waveId", requireRole("super_admin"), async (req, res) => {
    try {
      const { userId, waveId } = req.params;
      const { maxProperties } = req.body;
      
      const permission = await storage.getWavePermission(userId, waveId);
      if (!permission) {
        return res.status(404).json({ message: "Wave permission not found" });
      }
      
      const updated = await storage.updateWavePermission(permission.id, {
        maxProperties,
        grantedBy: req.session.userId!
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating wave permission:", error);
      res.status(500).json({ message: "Failed to update wave permission" });
    }
  });

  // Revoke wave permission (super admin only)
  app.delete("/api/customers/:userId/wave-permissions/:waveId", requireRole("super_admin"), async (req, res) => {
    try {
      const { userId, waveId } = req.params;
      const success = await storage.revokeWavePermission(userId, waveId);
      
      if (!success) {
        return res.status(404).json({ message: "Wave permission not found" });
      }
      
      res.json({ message: "Wave permission revoked successfully" });
    } catch (error) {
      console.error("Error revoking wave permission:", error);
      res.status(500).json({ message: "Failed to revoke wave permission" });
    }
  });

  // Get properties by wave (for map display)
  app.get("/api/waves/:waveId/properties", requireAuth, async (req, res) => {
    try {
      const { waveId } = req.params;
      const properties = await storage.getPropertiesByWave(waveId);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching wave properties:", error);
      res.status(500).json({ message: "Failed to fetch wave properties" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
