// server/index.ts
import express2 from "express";
import compression from "compression";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
import { sql, relations } from "drizzle-orm";
import { mysqlTable, text, varchar, int, decimal, boolean, timestamp, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var SUPPORTED_LANGUAGES = ["en", "ar", "kur"];
var users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 191 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  // "user" | "admin" | "super_admin"
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").default(false),
  waveBalance: int("wave_balance").default(10),
  // Number of waves user can assign to properties
  expiresAt: timestamp("expires_at"),
  // User account expiration date
  isExpired: boolean("is_expired").default(false),
  // Computed or manual flag for expiration status
  allowedLanguages: json("allowed_languages").$type(),
  // Languages user can add data in: "en", "ar", "ku"
  createdAt: timestamp("created_at").defaultNow()
});
var properties = mysqlTable("properties", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  // "house" | "apartment" | "villa" | "land"
  listingType: text("listing_type").notNull(),
  // "sale" | "rent"
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  area: int("area"),
  // in square meters
  address: text("address").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  images: json("images").$type(),
  amenities: json("amenities").$type(),
  features: json("features").$type(),
  status: varchar("status", { length: 16 }).default("active"),
  // "active" | "sold" | "rented" | "pending"
  language: varchar("language", { length: 3 }).notNull().default("en"),
  // Language of the property data: "en", "ar", "ku"
  agentId: varchar("agent_id", { length: 36 }).references(() => users.id),
  contactPhone: text("contact_phone"),
  // Contact phone number for this property (WhatsApp and calls)
  waveId: varchar("wave_id", { length: 36 }).references(() => waves.id),
  // Wave assignment
  views: int("views").default(0),
  isFeatured: boolean("is_featured").default(false),
  slug: varchar("slug", { length: 255 }).unique(),
  // SEO-friendly URL slug (nullable for backward compatibility)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var inquiries = mysqlTable("inquiries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: varchar("status", { length: 16 }).default("pending"),
  // "pending" | "replied" | "closed"
  createdAt: timestamp("created_at").defaultNow()
});
var favorites = mysqlTable("favorites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id),
  createdAt: timestamp("created_at").defaultNow()
});
var searchHistory = mysqlTable("search_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  query: text("query").notNull(),
  filters: json("filters").$type(),
  results: int("results").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var customerActivity = mysqlTable("customer_activity", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  activityType: text("activity_type").notNull(),
  // "property_view" | "search" | "favorite_add" | "favorite_remove" | "inquiry_sent" | "login" | "profile_update"
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id),
  metadata: json("metadata").$type(),
  points: int("points").default(0),
  // Points earned for this activity
  createdAt: timestamp("created_at").defaultNow()
});
var customerPoints = mysqlTable("customer_points", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull().unique(),
  totalPoints: int("total_points").default(0),
  currentLevel: varchar("current_level", { length: 20 }).default("Bronze"),
  // Bronze, Silver, Gold, Platinum
  pointsThisMonth: int("points_this_month").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var userPreferences = mysqlTable("user_preferences", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull().unique(),
  preferredPropertyTypes: json("preferred_property_types").$type(),
  // ["apartment", "house", "villa"]
  preferredListingTypes: json("preferred_listing_types").$type(),
  // ["sale", "rent"]
  budgetRange: json("budget_range").$type(),
  preferredLocations: json("preferred_locations").$type(),
  // ["erbil", "baghdad"]
  preferredBedrooms: json("preferred_bedrooms").$type(),
  // [2, 3, 4]
  preferredAmenities: json("preferred_amenities").$type(),
  // ["parking", "pool"]
  viewingHistory: json("viewing_history").$type(),
  // propertyId -> view_count
  interactionScores: json("interaction_scores").$type(),
  // propertyId -> score
  lastRecommendationUpdate: timestamp("last_recommendation_update").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var userRecommendations = mysqlTable("user_recommendations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id).notNull(),
  recommendationType: text("recommendation_type").notNull(),
  // "personalized", "similar", "trending", "location_based"
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull().default("0.50"),
  // 0.0 - 1.0
  reasoning: json("reasoning").$type(),
  // ["matches_price_range", "similar_to_favorites"]
  isViewed: boolean("is_viewed").default(false),
  isClicked: boolean("is_clicked").default(false),
  isFavorited: boolean("is_favorited").default(false),
  feedbackScore: int("feedback_score"),
  // User feedback: -1 (negative), 0 (neutral), 1 (positive)
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").default(sql`(NOW() + INTERVAL 7 DAY)`)
});
var propertySimilarity = mysqlTable("property_similarity", {
  id: varchar("id", { length: 36 }).primaryKey(),
  propertyId1: varchar("property_id_1", { length: 36 }).references(() => properties.id).notNull(),
  propertyId2: varchar("property_id_2", { length: 36 }).references(() => properties.id).notNull(),
  similarityScore: decimal("similarity_score", { precision: 3, scale: 2 }).notNull(),
  // 0.0 - 1.0
  similarityFactors: json("similarity_factors").$type(),
  // {"price": 0.8, "location": 0.9}
  calculatedAt: timestamp("calculated_at").defaultNow()
});
var recommendationAnalytics = mysqlTable("recommendation_analytics", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  recommendationType: text("recommendation_type").notNull(),
  totalGenerated: int("total_generated").default(0),
  totalViewed: int("total_viewed").default(0),
  totalClicked: int("total_clicked").default(0),
  totalFavorited: int("total_favorited").default(0),
  clickThroughRate: decimal("click_through_rate", { precision: 3, scale: 2 }).default("0.00"),
  conversionRate: decimal("conversion_rate", { precision: 3, scale: 2 }).default("0.00"),
  avgConfidenceScore: decimal("avg_confidence_score", { precision: 3, scale: 2 }).default("0.50"),
  period: text("period").notNull(),
  // "daily", "weekly", "monthly"
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var currencyRates = mysqlTable("currency_rates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull().default("USD"),
  // Base currency (always USD)
  toCurrency: text("to_currency").notNull(),
  // Target currency (IQD, AED, EUR, etc.)
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(),
  // Exchange rate (e.g., 1173.0 for USD to IQD)
  isActive: boolean("is_active").default(true),
  setBy: varchar("set_by", { length: 36 }).references(() => users.id),
  // Super admin who set this rate
  effectiveDate: timestamp("effective_date").defaultNow(),
  // When this rate becomes effective
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var waves = mysqlTable("waves", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  // Hex color for map display
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var customerWavePermissions = mysqlTable("customer_wave_permissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  waveId: varchar("wave_id", { length: 36 }).references(() => waves.id).notNull(),
  maxProperties: int("max_properties").notNull().default(1),
  // How many properties customer can assign to this wave
  usedProperties: int("used_properties").default(0),
  // How many properties customer has already assigned
  grantedBy: varchar("granted_by", { length: 36 }).references(() => users.id),
  // Super admin who granted permission
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow()
});
var usersRelations = relations(users, ({ one, many }) => ({
  properties: many(properties),
  inquiries: many(inquiries),
  favorites: many(favorites),
  searchHistory: many(searchHistory),
  customerActivity: many(customerActivity),
  customerPoints: one(customerPoints),
  wavePermissions: many(customerWavePermissions),
  createdWaves: many(waves)
}));
var propertiesRelations = relations(properties, ({ one, many }) => ({
  agent: one(users, {
    fields: [properties.agentId],
    references: [users.id]
  }),
  wave: one(waves, {
    fields: [properties.waveId],
    references: [waves.id]
  }),
  inquiries: many(inquiries),
  favorites: many(favorites)
}));
var wavesRelations = relations(waves, ({ one, many }) => ({
  properties: many(properties),
  permissions: many(customerWavePermissions),
  createdBy: one(users, {
    fields: [waves.createdBy],
    references: [users.id]
  })
}));
var customerWavePermissionsRelations = relations(customerWavePermissions, ({ one }) => ({
  user: one(users, {
    fields: [customerWavePermissions.userId],
    references: [users.id]
  }),
  wave: one(waves, {
    fields: [customerWavePermissions.waveId],
    references: [waves.id]
  }),
  grantedBy: one(users, {
    fields: [customerWavePermissions.grantedBy],
    references: [users.id]
  })
}));
var currencyRatesRelations = relations(currencyRates, ({ one }) => ({
  setBy: one(users, {
    fields: [currencyRates.setBy],
    references: [users.id]
  })
}));
var inquiriesRelations = relations(inquiries, ({ one }) => ({
  property: one(properties, {
    fields: [inquiries.propertyId],
    references: [properties.id]
  }),
  user: one(users, {
    fields: [inquiries.userId],
    references: [users.id]
  })
}));
var favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id]
  })
}));
var searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id]
  })
}));
var customerActivityRelations = relations(customerActivity, ({ one }) => ({
  user: one(users, {
    fields: [customerActivity.userId],
    references: [users.id]
  }),
  property: one(properties, {
    fields: [customerActivity.propertyId],
    references: [properties.id]
  })
}));
var customerPointsRelations = relations(customerPoints, ({ one }) => ({
  user: one(users, {
    fields: [customerPoints.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isExpired: true
  // This will be computed based on expiresAt
}).extend({
  allowedLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).default(["en"])
});
var insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  slug: true
  // Slug will be auto-generated
}).extend({
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  features: z.array(z.string()).default([])
});
var updatePropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  slug: true
  // Slug will be auto-regenerated if needed
}).extend({
  language: z.enum(SUPPORTED_LANGUAGES).optional()
  // No default for updates
}).partial();
var insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  status: true
});
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});
var insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  createdAt: true
}).extend({
  filters: z.record(z.any()).default({})
});
var insertCustomerActivitySchema = createInsertSchema(customerActivity).omit({
  id: true,
  createdAt: true
}).extend({
  metadata: z.record(z.any()).default({})
});
var insertCustomerPointsSchema = createInsertSchema(customerPoints).omit({
  id: true,
  lastActivity: true,
  updatedAt: true
});
var insertWaveSchema = createInsertSchema(waves).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCustomerWavePermissionSchema = createInsertSchema(customerWavePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  effectiveDate: true
});
var updateCurrencyRateSchema = createInsertSchema(currencyRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  effectiveDate: true
}).partial();

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
var db;
function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDb() first.");
  }
  return db;
}

// server/storage.ts
import { eq, and, like, gte, lte, desc, asc, sql as sql2 } from "drizzle-orm";

// shared/slug-utils.ts
var arabicToLatin = {
  "\u0627": "a",
  "\u0623": "a",
  "\u0625": "i",
  "\u0622": "aa",
  "\u0628": "b",
  "\u062A": "t",
  "\u062B": "th",
  "\u062C": "j",
  "\u062D": "h",
  "\u062E": "kh",
  "\u062F": "d",
  "\u0630": "dh",
  "\u0631": "r",
  "\u0632": "z",
  "\u0633": "s",
  "\u0634": "sh",
  "\u0635": "s",
  "\u0636": "d",
  "\u0637": "t",
  "\u0638": "z",
  "\u0639": "a",
  "\u063A": "gh",
  "\u0641": "f",
  "\u0642": "q",
  "\u0643": "k",
  "\u0644": "l",
  "\u0645": "m",
  "\u0646": "n",
  "\u0647": "h",
  "\u0648": "w",
  "\u064A": "y",
  "\u0629": "a",
  "\u0649": "a",
  "\u0626": "e",
  "\u0621": ""
};
var kurdishToLatin = {
  "\u0627": "a",
  "\u0628": "b",
  "\u067E": "p",
  "\u062A": "t",
  "\u062C": "j",
  "\u0686": "ch",
  "\u062D": "h",
  "\u062E": "kh",
  "\u062F": "d",
  "\u0631": "r",
  "\u0695": "rr",
  "\u0632": "z",
  "\u0698": "zh",
  "\u0633": "s",
  "\u0634": "sh",
  "\u0639": "a",
  "\u063A": "gh",
  "\u0641": "f",
  "\u06A4": "v",
  "\u0642": "q",
  "\u06A9": "k",
  "\u06AF": "g",
  "\u0644": "l",
  "\u06B5": "ll",
  "\u0645": "m",
  "\u0646": "n",
  "\u06B6": "nn",
  "\u0647": "h",
  "\u06BE": "h",
  "\u0648": "w",
  "\u06CC": "y",
  "\u06CE": "e",
  "\u06D5": "a",
  "\u06C6": "o",
  "\u06C7": "u"
};
var ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F]/;
var KURDISH_RANGE = /[\u06C0-\u06FF\u0750-\u077F]|[\u0695\u0698\u06a4\u06af\u06b5\u06d5]/;
function hasArabicScript(text2) {
  return ARABIC_RANGE.test(text2);
}
function hasKurdishScript(text2) {
  return KURDISH_RANGE.test(text2);
}
function transliterateArabic(text2) {
  const normalized = text2.normalize("NFKD");
  return normalized.split("").map((char) => arabicToLatin[char] || char).join("").replace(/[\u064b\u064c\u064d\u064e\u064f\u0650\u0651\u0652]/g, "").trim();
}
function transliterateKurdish(text2) {
  const normalized = text2.normalize("NFKD");
  return normalized.split("").map((char) => kurdishToLatin[char] || char).join("").trim();
}
function smartTransliterate(text2) {
  if (hasKurdishScript(text2)) {
    return transliterateKurdish(text2);
  } else if (hasArabicScript(text2)) {
    return transliterateArabic(text2);
  }
  return text2;
}
function cleanSlugText(text2) {
  return text2.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").trim().substring(0, 100);
}
function generatePropertySlug(property) {
  const parts = [];
  if (property.city) {
    const citySlug = smartTransliterate(property.city);
    const cleanCity = cleanSlugText(citySlug);
    if (cleanCity) {
      parts.push(cleanCity);
    }
  }
  if (property.bedrooms && property.bedrooms > 0) {
    parts.push(`${property.bedrooms}-bedroom`);
  }
  if (property.type) {
    const typeSlug = smartTransliterate(property.type);
    const cleanType = cleanSlugText(typeSlug);
    if (cleanType) {
      parts.push(cleanType);
    }
  }
  if (property.listingType) {
    const listingTypeMap = {
      "sale": "for-sale",
      "rent": "for-rent"
    };
    parts.push(listingTypeMap[property.listingType] || property.listingType);
  }
  if (parts.length < 3 && property.title) {
    const titleSlug = smartTransliterate(property.title);
    const titleWords = cleanSlugText(titleSlug).split("-").filter((word) => word.length > 2).slice(0, 3);
    parts.push(...titleWords);
  }
  if (parts.length === 0) {
    parts.push("property");
  }
  return parts.join("-");
}

// server/storage.ts
var MemStorage = class {
  users = [];
  properties = [];
  inquiries = [];
  favorites = [];
  searchHistories = [];
  waves = [];
  currencyRates = [];
  constructor() {
    this.initializeDefaultUsers();
    this.initializeDefaultWaves();
    this.initializeDefaultProperties();
    this.initializeDefaultCurrencyRates();
  }
  async initializeDefaultUsers() {
    const bcrypt2 = await import("bcryptjs");
    const adminPasswordHash = await bcrypt2.hash("admin123", 12);
    this.users.push({
      id: "admin-001",
      username: "admin",
      email: "admin@estateai.com",
      password: adminPasswordHash,
      role: "super_admin",
      firstName: "System",
      lastName: "Admin",
      phone: "+964 750 000 0000",
      isVerified: true,
      avatar: null,
      waveBalance: 999999,
      allowedLanguages: ["en", "ar", "ku"],
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: null,
      isExpired: false
    });
    const customerPasswordHash = await bcrypt2.hash("customer123", 12);
    this.users.push({
      id: "customer-001",
      username: "Jutyar",
      email: "jutyar@estateai.com",
      password: customerPasswordHash,
      role: "user",
      firstName: "Jutyar",
      lastName: "Customer",
      phone: "+964 750 111 2222",
      isVerified: true,
      avatar: null,
      waveBalance: 10,
      allowedLanguages: ["en"],
      // Example: only English allowed for this user
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: null,
      isExpired: false
    });
  }
  async initializeDefaultWaves() {
    const defaultWaves = [
      { name: "Premium Wave", description: "Premium properties with special circle motion effect", color: "#F59E0B" },
      { name: "Luxury Homes", description: "High-end luxury properties", color: "#9333EA" },
      { name: "Budget Friendly", description: "Affordable housing options", color: "#059669" },
      { name: "Family Homes", description: "Perfect for families with children", color: "#DC2626" },
      { name: "City Center", description: "Properties in prime city locations", color: "#2563EB" },
      { name: "Suburban Living", description: "Quiet suburban properties", color: "#EA580C" },
      { name: "Investment Properties", description: "Great for rental income", color: "#7C2D12" },
      { name: "New Construction", description: "Recently built properties", color: "#0D9488" }
    ];
    defaultWaves.forEach((wave, index) => {
      this.waves.push({
        id: `wave-${index + 1}`,
        name: wave.name,
        description: wave.description,
        color: wave.color,
        isActive: true,
        createdBy: "admin-001",
        // Admin user creates these waves
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
    });
  }
  async initializeDefaultProperties() {
    const agentUser = {
      id: "agent-001",
      username: "john_agent",
      email: "john@estateai.com",
      password: "hashedpassword123",
      role: "agent",
      firstName: "John",
      lastName: "Smith",
      phone: "+964 750 123 4567",
      isVerified: true,
      avatar: null,
      waveBalance: 50,
      allowedLanguages: ["en", "ar"],
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: null,
      isExpired: false
    };
    this.users.push(agentUser);
    const sampleProperties = [
      // Kurdish Properties
      {
        title: "\u06A4\u06CC\u0644\u0627\u06CC \u0641\u0627\u062E\u0631 \u0644\u06D5 \u0647\u06D5\u0648\u0644\u06CE\u0631",
        description: "\u06A4\u06CC\u0644\u0627\u06CC\u06D5\u06A9\u06CC \u062C\u0648\u0627\u0646\u06CC \u0664 \u0698\u0648\u0648\u0631\u06CC \u0646\u0648\u0633\u062A\u0646 \u0644\u06D5 \u0647\u06D5\u0648\u0644\u06CE\u0631 \u0644\u06D5\u06AF\u06D5\u06B5 \u062A\u0627\u06CC\u0628\u06D5\u062A\u0645\u06D5\u0646\u062F\u06CC\u06CC\u06D5 \u0645\u06C6\u062F\u06CE\u0695\u0646\u06D5\u06A9\u0627\u0646. \u0628\u06D5\u0633\u062A\u06CC \u0628\u06D5\u0631\u0641\u0631\u0627\u0648\u0627\u0646\u06CC \u0698\u06CC\u0627\u0646\u060C \u0645\u06D5\u062A\u0628\u06D5\u062E\u06CC \u0645\u06C6\u062F\u06CE\u0695\u0646\u060C \u0628\u0627\u062E\u0686\u06D5\u060C \u0648 \u067E\u0627\u0631\u06A9\u06CC\u0646\u06AF.",
        type: "villa",
        listingType: "sale",
        price: "450000",
        currency: "USD",
        bedrooms: 4,
        bathrooms: 3,
        area: 3200,
        address: "\u0634\u06D5\u0642\u0627\u0645\u06CC \u06AF\u0648\u0644\u0627\u0646\u060C \u0646\u0627\u0648\u06D5\u0646\u062F\u06CC \u0634\u0627\u0631\u06CC \u0647\u06D5\u0648\u0644\u06CE\u0631",
        city: "Erbil",
        country: "Iraq",
        latitude: "36.1911",
        longitude: "44.0093",
        images: [
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["\u062D\u06D5\u0648\u0632\u06CC \u0645\u06D5\u0644\u06D5\u0648\u0627\u0646\u06CC", "\u0628\u0627\u062E\u0686\u06D5", "\u067E\u0627\u0631\u06A9\u06CC\u0646\u06AF", "\u0633\u06CC\u0633\u062A\u06D5\u0645\u06CC \u0626\u0627\u0633\u0627\u06CC\u0634"],
        features: ["\u0626\u06CC\u0631 \u06A9\u06D5\u0646\u062F\u06CC\u0634\u06D5\u0646\u06D5\u0631\u06CC \u0646\u0627\u0648\u06D5\u0646\u062F\u06CC", "\u0645\u06D5\u062A\u0628\u06D5\u062E\u06CC \u0645\u06C6\u062F\u06CE\u0695\u0646", "\u0628\u0627\u0644\u06A9\u06C6\u0646", "\u0698\u0648\u0648\u0631\u06CC \u06A9\u06C6\u06AF\u0627"],
        language: "kur",
        agentId: "agent-001",
        isFeatured: true
      },
      {
        title: "\u0645\u0627\u06B5\u06CC \u062E\u06CE\u0632\u0627\u0646 \u0644\u06D5 \u0633\u0644\u06CE\u0645\u0627\u0646\u06CC",
        description: "\u0645\u0627\u06B5\u06CE\u06A9\u06CC \u0626\u0627\u0631\u0627\u0645 \u0628\u06C6 \u062E\u06CE\u0632\u0627\u0646 \u0644\u06D5\u06AF\u06D5\u06B5 \u0663 \u0698\u0648\u0648\u0631\u06CC \u0646\u0648\u0633\u062A\u0646 \u0648 \u0628\u0627\u062E\u0686\u06D5\u06CC\u06D5\u06A9\u06CC \u062C\u0648\u0627\u0646. \u0644\u06D5 \u06AF\u06D5\u0695\u06D5\u06A9\u06CE\u06A9\u06CC \u0647\u06CE\u0645\u0646 \u062F\u06D5\u06A9\u06D5\u0648\u06CE\u062A\u06D5\u0648\u06D5.",
        type: "house",
        listingType: "sale",
        price: "180000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 2,
        area: 2e3,
        address: "\u0634\u06D5\u0642\u0627\u0645\u06CC \u0626\u0627\u0632\u0627\u062F\u06CC\u060C \u0633\u0644\u06CE\u0645\u0627\u0646\u06CC",
        city: "Sulaymaniyah",
        country: "Iraq",
        latitude: "35.5651",
        longitude: "45.4305",
        images: [
          "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["\u0628\u0627\u062E\u0686\u06D5", "\u067E\u0627\u0631\u06A9\u06CC\u0646\u06AF", "\u0698\u06CE\u0631\u0632\u06D5\u0648\u06CC"],
        features: ["\u0628\u062E\u0627\u0631\u06CC", "\u067E\u06D5\u0646\u062C\u06D5\u0631\u06D5\u06CC \u06AF\u06D5\u0648\u0631\u06D5", "\u06A9\u06C6\u06AF\u0627"],
        language: "kur",
        agentId: "agent-001",
        isFeatured: false
      },
      {
        title: "\u0634\u0648\u0642\u06D5\u06CC \u0645\u06C6\u062F\u06CE\u0695\u0646 \u0644\u06D5 \u062F\u0647\u06C6\u06A9",
        description: "\u0634\u0648\u0642\u06D5\u06CC\u06D5\u06A9\u06CC \u0645\u06C6\u062F\u06CE\u0695\u0646 \u0644\u06D5 \u062F\u0647\u06C6\u06A9 \u0628\u06C6 \u062E\u0627\u0648\u06D5\u0646 \u067E\u06CC\u0634\u06D5 \u06AF\u06D5\u0646\u062C \u06CC\u0627\u0646 \u062E\u06CE\u0632\u0627\u0646\u06CC \u0628\u0686\u0648\u0648\u06A9. \u0647\u06D5\u0645\u0648\u0648 \u06A9\u06D5\u0644\u0648\u067E\u06D5\u0644\u06CE\u06A9\u06CC \u067E\u06CE\u0648\u06CC\u0633\u062A \u0647\u06D5\u06CC\u06D5.",
        type: "apartment",
        listingType: "rent",
        price: "600",
        currency: "USD",
        bedrooms: 2,
        bathrooms: 1,
        area: 900,
        address: "\u0646\u0627\u062D\u06CC\u06D5\u06CC \u0646\u06D5\u062E\u0644\u06D5\u060C \u062F\u0647\u06C6\u06A9",
        city: "Duhok",
        country: "Iraq",
        latitude: "36.8628",
        longitude: "42.9782",
        images: [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["\u067E\u0627\u0631\u06A9\u06CC\u0646\u06AF", "\u0626\u0627\u0633\u0627\u06CC\u0634", "\u0644\u06CC\u0641\u062A"],
        features: ["\u0645\u06D5\u062A\u0628\u06D5\u062E\u06CC \u0645\u06C6\u062F\u06CE\u0695\u0646", "\u0628\u0627\u0644\u06A9\u06C6\u0646", "\u0626\u0627\u0645\u0627\u062F\u06D5\u06CC\u06CC \u0626\u06CC\u0646\u062A\u06D5\u0631\u0646\u06CE\u062A"],
        language: "kur",
        agentId: "agent-001",
        isFeatured: true
      },
      // Arabic Properties
      {
        title: "\u0641\u064A\u0644\u0627 \u0641\u0627\u062E\u0631\u0629 \u0641\u064A \u0628\u063A\u062F\u0627\u062F",
        description: "\u0641\u064A\u0644\u0627 \u0631\u0627\u0626\u0639\u0629 \u0628\u0640 5 \u063A\u0631\u0641 \u0646\u0648\u0645 \u0645\u0639 \u062D\u062F\u064A\u0642\u0629 \u062E\u0627\u0635\u0629 \u0648\u0645\u0633\u0628\u062D. \u062A\u0642\u0639 \u0641\u064A \u0645\u0646\u0637\u0642\u0629 \u0631\u0627\u0642\u064A\u0629 \u0641\u064A \u0628\u063A\u062F\u0627\u062F \u0645\u0639 \u062C\u0645\u064A\u0639 \u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u0631\u0627\u062D\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629.",
        type: "villa",
        listingType: "sale",
        price: "520000",
        currency: "USD",
        bedrooms: 5,
        bathrooms: 4,
        area: 3800,
        address: "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u0646\u0635\u0648\u0631\u060C \u0628\u063A\u062F\u0627\u062F",
        city: "Baghdad",
        country: "Iraq",
        latitude: "33.3152",
        longitude: "44.3661",
        images: [
          "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["\u0645\u0633\u0628\u062D \u062E\u0627\u0635", "\u062D\u062F\u064A\u0642\u0629 \u0645\u064F\u0646\u0633\u0642\u0629", "\u0645\u0631\u0622\u0628 \u062E\u0627\u0635", "\u0646\u0638\u0627\u0645 \u0623\u0645\u0627\u0646"],
        features: ["\u062A\u0635\u0645\u064A\u0645 \u0645\u0639\u0627\u0635\u0631", "\u0645\u0637\u0628\u062E \u0645\u062C\u0647\u0632", "\u0634\u0631\u0641\u0627\u062A \u0648\u0627\u0633\u0639\u0629", "\u0625\u0636\u0627\u0621\u0629 \u0637\u0628\u064A\u0639\u064A\u0629"],
        language: "ar",
        agentId: "agent-001",
        isFeatured: true
      },
      {
        title: "\u0628\u064A\u062A \u062A\u0642\u0644\u064A\u062F\u064A \u0641\u064A \u0627\u0644\u0646\u062C\u0641",
        description: "\u0645\u0646\u0632\u0644 \u062A\u0642\u0644\u064A\u062F\u064A \u062C\u0645\u064A\u0644 \u0645\u064F\u0631\u0645\u0645 \u0628\u0639\u0646\u0627\u064A\u0629 \u0645\u0639 \u0641\u0646\u0627\u0621 \u062F\u0627\u062E\u0644\u064A \u0648\u0647\u0646\u062F\u0633\u0629 \u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0623\u0635\u064A\u0644\u0629. \u064A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u062A\u0631\u0627\u062B \u0648\u0627\u0644\u0631\u0627\u062D\u0629 \u0627\u0644\u0639\u0635\u0631\u064A\u0629.",
        type: "house",
        listingType: "sale",
        price: "165000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 3,
        area: 1900,
        address: "\u0627\u0644\u062D\u064A \u0627\u0644\u062A\u0631\u0627\u062B\u064A\u060C \u0627\u0644\u0646\u062C\u0641",
        city: "Najaf",
        country: "Iraq",
        latitude: "32.0000",
        longitude: "44.3333",
        images: [
          "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["\u0641\u0646\u0627\u0621 \u062F\u0627\u062E\u0644\u064A", "\u0637\u0631\u0627\u0632 \u062A\u0631\u0627\u062B\u064A", "\u0645\u0637\u0628\u062E \u0645\u064F\u062D\u062F\u062B", "\u0645\u0648\u0642\u0641 \u0633\u064A\u0627\u0631\u0627\u062A"],
        features: ["\u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u0639\u0645\u0627\u0631\u064A\u0629 \u0623\u0635\u064A\u0644\u0629", "\u0623\u0633\u0642\u0641 \u0639\u0627\u0644\u064A\u0629", "\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0639\u0635\u0631\u064A\u0629"],
        language: "ar",
        agentId: "agent-001",
        isFeatured: false
      },
      {
        title: "\u0634\u0642\u0629 \u0639\u0635\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0628\u0635\u0631\u0629",
        description: "\u0634\u0642\u0629 \u0623\u0646\u064A\u0642\u0629 \u0628\u063A\u0631\u0641\u062A\u064A \u0646\u0648\u0645 \u062A\u0637\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0631\u064A\u0646\u0627 \u0645\u0639 \u0625\u0637\u0644\u0627\u0644\u0627\u062A \u0645\u0627\u0626\u064A\u0629 \u062E\u0644\u0627\u0628\u0629 \u0648\u0648\u0633\u0627\u0626\u0644 \u0631\u0627\u062D\u0629 \u0641\u0627\u062E\u0631\u0629.",
        type: "apartment",
        listingType: "rent",
        price: "1000",
        currency: "USD",
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        address: "\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u0627\u0631\u064A\u0646\u0627\u060C \u0627\u0644\u0628\u0635\u0631\u0629",
        city: "Basra",
        country: "Iraq",
        latitude: "30.5234",
        longitude: "47.8077",
        images: [
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["\u0625\u0637\u0644\u0627\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0631\u064A\u0646\u0627", "\u0645\u0633\u0628\u062D", "\u0635\u0627\u0644\u0629 \u0631\u064A\u0627\u0636\u0629", "\u062E\u062F\u0645\u0629 \u062D\u0631\u0627\u0633\u0629"],
        features: ["\u0646\u0648\u0627\u0641\u0630 \u0628\u0627\u0646\u0648\u0631\u0627\u0645\u064A\u0629", "\u0623\u062C\u0647\u0632\u0629 \u0641\u0627\u062E\u0631\u0629", "\u0634\u0631\u0641\u0629 \u0645\u0637\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0621"],
        language: "ar",
        agentId: "agent-001",
        isFeatured: true
      },
      // English Properties
      {
        title: "Modern Penthouse in Baghdad",
        description: "Stunning penthouse with panoramic city views, rooftop terrace, and luxury finishes throughout. Located in a prime area with excellent amenities.",
        type: "apartment",
        listingType: "sale",
        price: "350000",
        currency: "USD",
        bedrooms: 3,
        bathrooms: 3,
        area: 2200,
        address: "Al-Karrada District, Baghdad",
        city: "Baghdad",
        country: "Iraq",
        latitude: "33.3128",
        longitude: "44.4025",
        images: [
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Rooftop Terrace", "Elevator", "Concierge", "Parking"],
        features: ["City Views", "High Ceilings", "Floor-to-Ceiling Windows"],
        language: "en",
        agentId: "agent-001",
        isFeatured: true
      },
      {
        title: "Traditional House in Mosul",
        description: "Beautifully restored traditional house with modern amenities, courtyard, and authentic architecture. Perfect blend of heritage and comfort.",
        type: "house",
        listingType: "sale",
        price: "145000",
        currency: "USD",
        bedrooms: 4,
        bathrooms: 2,
        area: 1800,
        address: "Old City, Mosul",
        city: "Mosul",
        country: "Iraq",
        latitude: "36.3489",
        longitude: "43.1189",
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1593696140826-c58b021acf8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Courtyard", "Traditional Architecture", "Parking"],
        features: ["Restored Historic Building", "High Ceilings", "Natural Light"],
        language: "en",
        agentId: "agent-001",
        isFeatured: false
      },
      {
        title: "Studio Apartment Near University",
        description: "Modern studio apartment perfect for students or young professionals. Fully furnished and ready to move in with all utilities included.",
        type: "apartment",
        listingType: "rent",
        price: "450",
        currency: "USD",
        bedrooms: 1,
        bathrooms: 1,
        area: 600,
        address: "University Street, Erbil",
        city: "Erbil",
        country: "Iraq",
        latitude: "36.1800",
        longitude: "44.0000",
        images: [
          "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1555854877-bab0e00b7ceb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
          "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
        ],
        amenities: ["Furnished", "WiFi", "Utilities Included"],
        features: ["Compact Design", "Modern Appliances", "Near University"],
        language: "en",
        agentId: "agent-001",
        isFeatured: true
      }
    ];
    for (let i = 0; i < sampleProperties.length; i++) {
      const property = sampleProperties[i];
      const propertyForSlug = {
        ...property,
        city: property.city || "",
        type: property.type || "",
        listingType: property.listingType || "sale",
        bedrooms: property.bedrooms || null,
        title: property.title || ""
      };
      const slug = generatePropertySlug(propertyForSlug);
      const newProperty = {
        id: `prop-${1e3 + i}`,
        ...property,
        description: property.description || null,
        currency: property.currency || "USD",
        status: "active",
        bedrooms: property.bedrooms || null,
        bathrooms: property.bathrooms || null,
        area: property.area || null,
        latitude: property.latitude || null,
        longitude: property.longitude || null,
        contactPhone: null,
        waveId: null,
        isFeatured: property.isFeatured || false,
        images: property.images || [],
        amenities: property.amenities || [],
        features: property.features || [],
        language: property.language || "en",
        views: Math.floor(Math.random() * 100) + 1,
        slug,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      this.properties.push(newProperty);
    }
    console.log(`\u2705 Initialized ${this.properties.length} sample properties in memory storage`);
  }
  initializeDefaultCurrencyRates() {
    this.currencyRates = [
      {
        id: "rate-usd-iqd",
        fromCurrency: "USD",
        toCurrency: "IQD",
        rate: "1310.00",
        isActive: true,
        setBy: "admin-001",
        effectiveDate: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "rate-usd-aed",
        fromCurrency: "USD",
        toCurrency: "AED",
        rate: "3.67",
        isActive: true,
        setBy: "admin-001",
        effectiveDate: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      },
      {
        id: "rate-usd-eur",
        fromCurrency: "USD",
        toCurrency: "EUR",
        rate: "0.851",
        isActive: true,
        setBy: "admin-001",
        effectiveDate: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    ];
    console.log(`\u2705 Initialized ${this.currencyRates.length} default currency rates in memory storage`);
  }
  // Users
  async getUser(id) {
    return this.users.find((u) => u.id === id);
  }
  async getUserByUsername(username) {
    return this.users.find((u) => u.username === username);
  }
  async getUserByEmail(email) {
    return this.users.find((u) => u.email === email);
  }
  async createUser(user) {
    const newUser = {
      id: `user-${Date.now()}`,
      ...user,
      role: user.role || "user",
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      phone: user.phone || null,
      avatar: user.avatar || null,
      isVerified: user.isVerified || null,
      waveBalance: user.waveBalance || null,
      allowedLanguages: user.allowedLanguages || ["en"],
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: user.expiresAt ? new Date(user.expiresAt) : null,
      isExpired: false
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUser(id, userData) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) return void 0;
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      expiresAt: userData.expiresAt ? new Date(userData.expiresAt) : this.users[userIndex].expiresAt
    };
    return this.users[userIndex];
  }
  async authenticateUser(username, password) {
    const bcrypt2 = await import("bcryptjs");
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const isPasswordValid = await bcrypt2.compare(password, user.password);
    return isPasswordValid ? user : null;
  }
  async getAllUsers() {
    return [...this.users];
  }
  async deleteUser(id) {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) return false;
    this.users.splice(userIndex, 1);
    return true;
  }
  // Property implementations
  async getProperty(id) {
    const property = this.properties.find((p) => p.id === id);
    if (!property) return void 0;
    const agent = this.users.find((u) => u.id === property.agentId);
    return {
      ...property,
      agent: agent || null,
      wave: null
    };
  }
  async getPropertyBySlug(slug) {
    const property = this.properties.find((p) => p.slug === slug);
    if (!property) return void 0;
    const agent = this.users.find((u) => u.id === property.agentId);
    return {
      ...property,
      agent: agent || null,
      wave: null
    };
  }
  async isSlugTaken(slug, excludePropertyId) {
    return this.properties.some(
      (p) => p.slug === slug && (!excludePropertyId || p.id !== excludePropertyId)
    );
  }
  async getProperties(filters) {
    let filteredProperties = [...this.properties];
    if (filters) {
      if (filters.type) {
        filteredProperties = filteredProperties.filter((p) => p.type === filters.type);
      }
      if (filters.listingType) {
        filteredProperties = filteredProperties.filter((p) => p.listingType === filters.listingType);
      }
      if (filters.minPrice) {
        filteredProperties = filteredProperties.filter((p) => parseFloat(p.price) >= filters.minPrice);
      }
      if (filters.maxPrice) {
        filteredProperties = filteredProperties.filter((p) => parseFloat(p.price) <= filters.maxPrice);
      }
      if (filters.bedrooms) {
        filteredProperties = filteredProperties.filter((p) => (p.bedrooms || 0) >= filters.bedrooms);
      }
      if (filters.bathrooms) {
        filteredProperties = filteredProperties.filter((p) => (p.bathrooms || 0) >= filters.bathrooms);
      }
      if (filters.city) {
        filteredProperties = filteredProperties.filter((p) => p.city.toLowerCase().includes(filters.city.toLowerCase()));
      }
      if (filters.country) {
        filteredProperties = filteredProperties.filter((p) => p.country === filters.country);
      }
      if (filters.language) {
        filteredProperties = filteredProperties.filter((p) => p.language === filters.language);
      }
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredProperties = filteredProperties.filter(
          (p) => p.title.toLowerCase().includes(searchTerm) || p.description && p.description.toLowerCase().includes(searchTerm) || p.address.toLowerCase().includes(searchTerm)
        );
      }
      filteredProperties = filteredProperties.filter((p) => p.status === "active");
      if (filters.limit) {
        filteredProperties = filteredProperties.slice(0, filters.limit);
      }
    }
    return filteredProperties.map((property) => {
      const agent = this.users.find((u) => u.id === property.agentId);
      return {
        ...property,
        agent: agent || null,
        wave: null
      };
    });
  }
  async getFeaturedProperties() {
    const featuredProperties = this.properties.filter((p) => p.isFeatured && p.status === "active").slice(0, 6);
    return featuredProperties.map((property) => {
      const agent = this.users.find((u) => u.id === property.agentId);
      return {
        ...property,
        agent: agent || null,
        wave: null
      };
    });
  }
  async createProperty(property) {
    const baseSlug = generatePropertySlug(property);
    let slug = baseSlug;
    let counter = 1;
    while (await this.isSlugTaken(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 1e3) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }
    const newProperty = {
      id: `prop-${Date.now()}`,
      ...property,
      description: property.description || null,
      currency: property.currency || "USD",
      status: property.status || "active",
      bedrooms: property.bedrooms || null,
      bathrooms: property.bathrooms || null,
      area: property.area || null,
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      contactPhone: property.contactPhone || null,
      agentId: property.agentId ?? null,
      waveId: property.waveId || null,
      isFeatured: property.isFeatured || null,
      images: property.images || [],
      amenities: property.amenities || [],
      features: property.features || [],
      language: property.language || "en",
      views: 0,
      slug,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.properties.push(newProperty);
    return newProperty;
  }
  async updateProperty(id, property) {
    const propertyIndex = this.properties.findIndex((p) => p.id === id);
    if (propertyIndex === -1) return void 0;
    const currentProperty = this.properties[propertyIndex];
    const slugAffectingFields = ["title", "city", "type", "listingType", "bedrooms"];
    const shouldRegenerateSlug = slugAffectingFields.some(
      (field) => property[field] !== void 0
    );
    let updateData = {
      ...property,
      images: property.images ? property.images : currentProperty.images,
      amenities: property.amenities ? property.amenities : currentProperty.amenities,
      features: property.features ? property.features : currentProperty.features,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (shouldRegenerateSlug) {
      const updatedPropertyData = { ...currentProperty, ...property };
      const baseSlug = generatePropertySlug(updatedPropertyData);
      let slug = baseSlug;
      let counter = 1;
      while (await this.isSlugTaken(slug, id)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > 1e3) {
          slug = `${baseSlug}-${Date.now()}`;
          break;
        }
      }
      updateData.slug = slug;
    }
    const updatedProperty = {
      ...currentProperty,
      ...updateData
    };
    this.properties[propertyIndex] = updatedProperty;
    return this.properties[propertyIndex];
  }
  async deleteProperty(id) {
    const propertyIndex = this.properties.findIndex((p) => p.id === id);
    if (propertyIndex === -1) return false;
    this.properties.splice(propertyIndex, 1);
    return true;
  }
  async incrementPropertyViews(id) {
  }
  async getInquiry(id) {
    return void 0;
  }
  async getInquiriesForProperty(propertyId) {
    return [];
  }
  async createInquiry(inquiry) {
    const newInquiry = {
      id: `inq-${Date.now()}`,
      ...inquiry,
      propertyId: inquiry.propertyId || null,
      userId: inquiry.userId || null,
      phone: inquiry.phone || null,
      status: "pending",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.inquiries.push(newInquiry);
    return newInquiry;
  }
  async updateInquiryStatus(id, status) {
    return void 0;
  }
  async getFavoritesByUser(userId) {
    const userFavorites = this.favorites.filter((f) => f.userId === userId);
    const favoriteProperties = userFavorites.map(
      (fav) => this.properties.find((p) => p.id === fav.propertyId)
    ).filter(Boolean);
    return favoriteProperties.map((property) => {
      const agent = this.users.find((u) => u.id === property.agentId);
      return {
        ...property,
        agent: agent || null,
        wave: null
      };
    });
  }
  async addToFavorites(favorite) {
    const newFavorite = {
      id: `fav-${Date.now()}`,
      userId: favorite.userId || null,
      propertyId: favorite.propertyId || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.favorites.push(newFavorite);
    return newFavorite;
  }
  async removeFromFavorites(userId, propertyId) {
    const index = this.favorites.findIndex((f) => f.userId === userId && f.propertyId === propertyId);
    if (index !== -1) {
      this.favorites.splice(index, 1);
      return true;
    }
    return false;
  }
  async isFavorite(userId, propertyId) {
    return this.favorites.some((f) => f.userId === userId && f.propertyId === propertyId);
  }
  async addSearchHistory(search) {
    const newSearch = {
      id: `search-${Date.now()}`,
      userId: search.userId || null,
      query: search.query,
      filters: search.filters || null,
      results: search.results || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.searchHistories.push(newSearch);
    return newSearch;
  }
  async getSearchHistoryByUser(userId) {
    return [];
  }
  // Customer Analytics stubs
  async addCustomerActivity(activity) {
    return {
      id: `activity-${Date.now()}`,
      ...activity,
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  async getCustomerActivities(userId, limit) {
    return [];
  }
  async getCustomerPoints(userId) {
    return void 0;
  }
  async updateCustomerPoints(userId, points) {
    return {
      id: `points-${userId}`,
      userId,
      totalPoints: points.totalPoints || 0,
      currentLevel: points.currentLevel || "Bronze",
      pointsThisMonth: points.pointsThisMonth || 0,
      lastActivity: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  async getCustomerAnalytics(userId) {
    return {
      totalActivities: 0,
      activitiesByType: [],
      pointsHistory: [],
      monthlyActivity: []
    };
  }
  // Wave management stubs
  async getWaves() {
    return this.waves.filter((w) => w.isActive);
  }
  async getWave(id) {
    return this.waves.find((w) => w.id === id && w.isActive);
  }
  async createWave(wave) {
    const newWave = {
      id: `wave-${Date.now()}`,
      ...wave,
      description: wave.description || null,
      color: wave.color || null,
      createdBy: wave.createdBy || null,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.waves.push(newWave);
    return newWave;
  }
  async updateWave(id, updateData) {
    const waveIndex = this.waves.findIndex((w) => w.id === id);
    if (waveIndex === -1) return void 0;
    this.waves[waveIndex] = {
      ...this.waves[waveIndex],
      ...updateData,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.waves[waveIndex];
  }
  async deleteWave(id) {
    const waveIndex = this.waves.findIndex((w) => w.id === id);
    if (waveIndex === -1) return false;
    this.waves[waveIndex].isActive = false;
    this.waves[waveIndex].updatedAt = /* @__PURE__ */ new Date();
    return true;
  }
  // Customer wave permissions stubs
  async getCustomerWavePermissions(userId) {
    return [];
  }
  async getWavePermission(userId, waveId) {
    return void 0;
  }
  async grantWavePermission(permission) {
    return {
      id: `perm-${Date.now()}`,
      ...permission,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
  }
  async updateWavePermission(id, permission) {
    return void 0;
  }
  async revokeWavePermission(userId, waveId) {
    return false;
  }
  async getPropertiesByWave(waveId) {
    return [];
  }
  // Wave balance tracking methods
  async getUserWaveUsage(userId) {
    return this.properties.filter(
      (p) => p.agentId === userId && p.waveId && p.waveId !== "no-wave"
    ).length;
  }
  async getUserRemainingWaves(userId) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return 0;
    if (user.role === "admin" || user.role === "super_admin") {
      return 999999;
    }
    const currentUsage = await this.getUserWaveUsage(userId);
    const remaining = (user.waveBalance || 0) - currentUsage;
    return Math.max(0, remaining);
  }
  async validateWaveAssignment(userId, waveId) {
    if (!waveId || waveId === "no-wave") {
      return { valid: true };
    }
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return { valid: false, message: "User not found" };
    }
    if (user.role === "admin" || user.role === "super_admin") {
      return { valid: true };
    }
    const remainingWaves = await this.getUserRemainingWaves(userId);
    if (remainingWaves <= 0) {
      return {
        valid: false,
        message: `No wave assignments remaining. Current balance: ${user.waveBalance || 0}`
      };
    }
    return { valid: true };
  }
  // Function to update wave balance for all users with 0 balance (in-memory)
  async updateUsersWithZeroWaveBalance() {
    let updatedCount = 0;
    this.users.forEach((user) => {
      if (user.role === "user" && (user.waveBalance || 0) === 0) {
        user.waveBalance = 10;
        updatedCount++;
      }
    });
    console.log(`Updated wave balance for ${updatedCount} users`);
    return updatedCount;
  }
  // Method to clear all properties
  async clearAllProperties() {
    const count = this.properties.length;
    this.properties = [];
    this.favorites = [];
    this.inquiries = [];
    this.searchHistories = [];
    console.log(`Cleared ${count} properties and related data`);
    return count;
  }
  // Currency exchange rates
  async getCurrencyRates() {
    return [...this.currencyRates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getActiveCurrencyRates() {
    return this.currencyRates.filter((rate) => rate.isActive).sort((a, b) => a.toCurrency.localeCompare(b.toCurrency));
  }
  async getCurrencyRate(fromCurrency, toCurrency) {
    return this.currencyRates.filter(
      (rate) => rate.fromCurrency === fromCurrency && rate.toCurrency === toCurrency && rate.isActive
    ).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];
  }
  async createCurrencyRate(rate) {
    const newRate = {
      id: `rate-${Date.now()}`,
      ...rate,
      effectiveDate: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.currencyRates.push(newRate);
    return newRate;
  }
  async updateCurrencyRate(id, rate) {
    const index = this.currencyRates.findIndex((r) => r.id === id);
    if (index === -1) return void 0;
    this.currencyRates[index] = {
      ...this.currencyRates[index],
      ...rate,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.currencyRates[index];
  }
  async deactivateCurrencyRate(id) {
    const index = this.currencyRates.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.currencyRates[index] = {
      ...this.currencyRates[index],
      isActive: false,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return true;
  }
  async convertPrice(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    const rate = await this.getCurrencyRate(fromCurrency, toCurrency);
    if (!rate) {
      const reverseRate = await this.getCurrencyRate(toCurrency, fromCurrency);
      if (reverseRate) {
        return amount / parseFloat(reverseRate.rate);
      }
      return amount;
    }
    return amount * parseFloat(rate.rate);
  }
};
var storage = new MemStorage();
async function initializeDatabase() {
  try {
    const existingUsers = await getDb().select({ count: sql2`count(*)` }).from(users);
    if (existingUsers[0]?.count > 0) {
      console.log("Users already exist, skipping initialization");
      return;
    }
    console.log("Initializing database with default users...");
    const bcrypt2 = await import("bcryptjs");
    const hashedAdminPassword = await bcrypt2.hash("admin123", 12);
    const hashedCustomerPassword = await bcrypt2.hash("customer123", 12);
    await getDb().insert(users).values({
      id: "admin-001",
      username: "admin",
      email: "admin@estateai.com",
      password: hashedAdminPassword,
      role: "super_admin",
      firstName: "System",
      lastName: "Admin",
      phone: "+964 750 000 0000",
      isVerified: true,
      waveBalance: 999999
    });
    const [admin] = await getDb().select().from(users).where(eq(users.id, "admin-001"));
    console.log("\u2705 Created admin user:", admin.username);
    await getDb().insert(users).values({
      id: "customer-001",
      username: "Jutyar",
      email: "jutyar@estateai.com",
      password: hashedCustomerPassword,
      role: "user",
      firstName: "Jutyar",
      lastName: "Customer",
      phone: "+964 750 111 2222",
      isVerified: true,
      waveBalance: 10
    });
    const [customer] = await getDb().select().from(users).where(eq(users.id, "customer-001"));
    console.log("\u2705 Created customer user:", customer.username);
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}
async function initializeWaves() {
  try {
    await getDb().update(properties).set({ waveId: null });
    console.log("Cleared wave assignments from properties");
    await getDb().delete(waves);
    console.log("Cleared existing waves");
    console.log("Creating default waves...");
    const adminUser = await getDb().select().from(users).where(eq(users.role, "super_admin")).limit(1);
    const adminId = adminUser[0]?.id;
    const defaultWaves = [
      { name: "Premium Wave", description: "Premium properties with special circle motion effect", color: "#F59E0B" },
      { name: "Luxury Homes", description: "High-end luxury properties", color: "#9333EA" },
      { name: "Budget Friendly", description: "Affordable housing options", color: "#059669" },
      { name: "Family Homes", description: "Perfect for families with children", color: "#DC2626" },
      { name: "City Center", description: "Properties in prime city locations", color: "#2563EB" },
      { name: "Suburban Living", description: "Quiet suburban properties", color: "#EA580C" },
      { name: "Investment Properties", description: "Great for rental income", color: "#7C2D12" },
      { name: "New Construction", description: "Recently built properties", color: "#0D9488" }
    ];
    for (const wave of defaultWaves) {
      await getDb().insert(waves).values({
        ...wave,
        createdBy: adminId,
        isActive: true
      });
    }
    console.log("\u2705 Created default waves for customers to use");
  } catch (error) {
    console.error("Failed to initialize waves:", error);
  }
}
if (!(storage instanceof MemStorage)) {
  initializeDatabase().then(() => {
    return initializeWaves();
  }).then(() => {
    console.log("\u2705 Database initialized - starting with empty property data");
  }).catch(console.error);
}

// server/auth.ts
import bcrypt from "bcryptjs";
var hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};
var requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
var requireRole = (role) => {
  return async (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== role && user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking user role" });
    }
  };
};
var requireAnyRole = (roles) => {
  return async (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !roles.includes(user.role) && user.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden: Insufficient privileges" });
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ message: "Error checking user role" });
    }
  };
};
var populateUser = async (req, res, next) => {
  if (req.session?.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      console.error("Error populating user:", error);
    }
  }
  next();
};
var validateLanguagePermission = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    let requestedLanguage = req.body.language;
    if (!requestedLanguage && req.method === "PUT" && req.params.id) {
      const existingProperty = await storage.getProperty(req.params.id);
      if (existingProperty) {
        requestedLanguage = existingProperty.language || "en";
      } else {
        return res.status(404).json({ message: "Property not found" });
      }
    }
    if (!requestedLanguage) {
      requestedLanguage = "en";
    }
    if (req.user.role === "super_admin") {
      return next();
    }
    const userAllowedLanguages = req.user.allowedLanguages || ["en"];
    if (!userAllowedLanguages.includes(requestedLanguage)) {
      return res.status(403).json({
        message: `You don't have permission to add data in language '${requestedLanguage}'. Allowed languages: ${userAllowedLanguages.join(", ")}`
      });
    }
    next();
  } catch (error) {
    console.error("Error validating language permission:", error);
    res.status(500).json({ message: "Error validating language permission" });
  }
};

// server/routes.ts
import session from "express-session";
import { z as z2 } from "zod";

// server/routes/sitemap.ts
import { Router } from "express";
var router = Router();
router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const properties2 = await storage.getProperties({ limit: 1e3 });
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Main pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/properties</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/favorites</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/settings</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  
  <!-- Property pages -->
  ${properties2.map((property) => {
      const identifier = property.slug || property.id;
      return `
  <url>
    <loc>${baseUrl}/property/${identifier}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${property.updatedAt ? new Date(property.updatedAt).toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
    ${property.images && property.images.length > 0 ? `
    <image:image>
      <image:loc>${property.images[0]}</image:loc>
      <image:title>${property.title}</image:title>
      <image:caption>${property.description || property.title}</image:caption>
    </image:image>` : ""}
  </url>`;
    }).join("")}
</urlset>`;
    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});
var sitemap_default = router;

// server/middleware/performance.ts
import { createHash } from "node:crypto";
var PerformanceMonitor = class {
  metrics = [];
  MAX_METRICS = 1e3;
  // Keep last 1000 metrics
  addMetric(metric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }
  getMetrics(hours = 1) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1e3);
    return this.metrics.filter((metric) => metric.timestamp >= cutoff);
  }
  getAverageResponseTime(endpoint, hours = 1) {
    const metrics = this.getMetrics(hours);
    const filtered = endpoint ? metrics.filter((m) => m.endpoint === endpoint) : metrics;
    if (filtered.length === 0) return 0;
    const total = filtered.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(total / filtered.length);
  }
  getSlowRequests(thresholdMs = 1e3, hours = 1) {
    return this.getMetrics(hours).filter((metric) => metric.responseTime > thresholdMs).sort((a, b) => b.responseTime - a.responseTime);
  }
  getEndpointStats(hours = 1) {
    const metrics = this.getMetrics(hours);
    const stats = {};
    metrics.forEach((metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!stats[key]) {
        stats[key] = { count: 0, totalTime: 0, slowRequests: 0 };
      }
      stats[key].count++;
      stats[key].totalTime += metric.responseTime;
      if (metric.responseTime > 1e3) {
        stats[key].slowRequests++;
      }
    });
    return Object.entries(stats).reduce((result, [key, data]) => {
      result[key] = {
        count: data.count,
        avgResponseTime: Math.round(data.totalTime / data.count),
        slowRequests: data.slowRequests
      };
      return result;
    }, {});
  }
};
var performanceMonitor = new PerformanceMonitor();
function performanceLogger(req, res, next) {
  const start = Date.now();
  const path4 = req.path;
  if (!path4.startsWith("/api")) {
    return next();
  }
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    const user = req.user;
    performanceMonitor.addMetric({
      endpoint: path4,
      method: req.method,
      responseTime: duration,
      timestamp: /* @__PURE__ */ new Date(),
      statusCode: res.statusCode,
      userId: user?.id,
      userAgent: req.get("User-Agent"),
      ip: req.ip || req.connection.remoteAddress || "unknown"
    });
    let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }
    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "\u2026";
    }
    if (duration > 2e3) {
      console.log(`\u{1F534} SLOW: ${logLine}`);
    } else if (duration > 1e3) {
      console.log(`\u{1F7E1} WARN: ${logLine}`);
    } else {
      console.log(logLine);
    }
    if (duration > 2e3) {
      console.warn(`\u26A0\uFE0F Slow API request detected: ${req.method} ${path4} took ${duration}ms`);
    }
  });
  next();
}
function cacheControl(options) {
  return (req, res, next) => {
    const cacheDirectives = [];
    if (options.noCache) {
      cacheDirectives.push("no-cache");
    }
    if (options.noStore) {
      cacheDirectives.push("no-store");
    }
    if (options.mustRevalidate) {
      cacheDirectives.push("must-revalidate");
    }
    if (options.maxAge !== void 0) {
      cacheDirectives.push(`max-age=${options.maxAge}`);
    }
    if (options.sMaxAge !== void 0) {
      cacheDirectives.push(`s-maxage=${options.sMaxAge}`);
    }
    if (options.immutable) {
      cacheDirectives.push("immutable");
    }
    if (cacheDirectives.length > 0) {
      res.set("Cache-Control", cacheDirectives.join(", "));
    }
    next();
  };
}
function generateETag(data) {
  try {
    const stableStringify = (obj) => {
      if (obj === null || typeof obj !== "object") {
        if (obj instanceof Date) {
          return obj.toISOString();
        }
        if (typeof obj === "bigint") {
          return obj.toString();
        }
        return String(obj);
      }
      if (Array.isArray(obj)) {
        return "[" + obj.map(stableStringify).join(",") + "]";
      }
      const sortedKeys = Object.keys(obj).sort();
      const pairs = sortedKeys.map(
        (key) => '"' + key + '":' + stableStringify(obj[key])
      );
      return "{" + pairs.join(",") + "}";
    };
    const stableString = stableStringify(data);
    return createHash("md5").update(stableString).digest("hex");
  } catch (error) {
    console.warn("ETag generation failed:", error);
    const fallbackData = `etag-error-fallback-${typeof data}-${String(data).slice(0, 100)}`;
    return createHash("md5").update(fallbackData).digest("hex");
  }
}
function handleConditionalRequest(req, res, data, lastModified) {
  const etag = generateETag(data);
  res.set("ETag", `"${etag}"`);
  if (lastModified) {
    res.set("Last-Modified", lastModified.toUTCString());
  }
  const ifNoneMatch = req.get("If-None-Match");
  if (ifNoneMatch === `"${etag}"`) {
    res.status(304).end();
    return true;
  }
  if (lastModified) {
    const ifModifiedSince = req.get("If-Modified-Since");
    if (ifModifiedSince) {
      const ifModifiedSinceDate = new Date(ifModifiedSince);
      if (lastModified <= ifModifiedSinceDate) {
        res.status(304).end();
        return true;
      }
    }
  }
  return false;
}
function requestSizeMonitor(maxSizeMB = 10) {
  return (req, res, next) => {
    const contentLength = req.get("Content-Length");
    if (contentLength) {
      const sizeMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        console.warn(`\u26A0\uFE0F Large request detected: ${req.method} ${req.path} - ${sizeMB.toFixed(2)}MB`);
      }
    }
    next();
  };
}
function trackQueryPerformance(queryName, queryFn) {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    try {
      const result = await queryFn();
      const duration = Date.now() - start;
      if (duration > 500) {
        console.warn(`\u{1F40C} Slow database query: ${queryName} took ${duration}ms`);
      } else if (duration > 100) {
        console.log(`\u{1F4CA} Query: ${queryName} completed in ${duration}ms`);
      }
      resolve(result);
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`\u274C Query failed: ${queryName} after ${duration}ms:`, error);
      reject(error);
    }
  });
}

// server/routes/performance.ts
function registerPerformanceRoutes(app2) {
  app2.get("/api/admin/performance", requireRole("admin"), (req, res) => {
    try {
      const { hours = 1 } = req.query;
      const hoursNumber = Math.min(parseInt(hours) || 1, 24);
      const metrics = performanceMonitor.getMetrics(hoursNumber);
      const endpointStats = performanceMonitor.getEndpointStats(hoursNumber);
      const slowRequests = performanceMonitor.getSlowRequests(1e3, hoursNumber);
      const averageResponseTime = performanceMonitor.getAverageResponseTime(void 0, hoursNumber);
      res.json({
        timeWindow: `${hoursNumber} hour(s)`,
        totalRequests: metrics.length,
        averageResponseTime,
        endpointStats,
        slowRequests: slowRequests.slice(0, 10),
        // Top 10 slowest
        recentMetrics: metrics.slice(-20),
        // Last 20 requests
        summary: {
          fastRequests: metrics.filter((m) => m.responseTime < 100).length,
          normalRequests: metrics.filter((m) => m.responseTime >= 100 && m.responseTime < 1e3).length,
          slowRequests: metrics.filter((m) => m.responseTime >= 1e3).length,
          errorRequests: metrics.filter((m) => m.statusCode >= 400).length
        }
      });
    } catch (error) {
      console.error("Failed to get performance metrics:", error);
      res.status(500).json({ message: "Failed to get performance metrics" });
    }
  });
  app2.get("/api/admin/performance/status", requireRole("admin"), (req, res) => {
    try {
      const recentMetrics = performanceMonitor.getMetrics(0.25);
      const currentLoad = recentMetrics.length;
      const avgResponseTime = performanceMonitor.getAverageResponseTime(void 0, 0.25);
      const errorRate = recentMetrics.filter((m) => m.statusCode >= 400).length / Math.max(recentMetrics.length, 1);
      let status = "healthy";
      let statusColor = "green";
      if (avgResponseTime > 2e3 || errorRate > 0.1) {
        status = "critical";
        statusColor = "red";
      } else if (avgResponseTime > 1e3 || errorRate > 0.05) {
        status = "warning";
        statusColor = "yellow";
      }
      res.json({
        status,
        statusColor,
        currentLoad,
        avgResponseTime,
        errorRate: Math.round(errorRate * 100),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Failed to get performance status:", error);
      res.status(500).json({ message: "Failed to get performance status" });
    }
  });
}

// server/middleware/rateLimiting.ts
import rateLimit from "express-rate-limit";
var authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // Limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`\u{1F6AB} Rate limit exceeded for auth: ${req.ip} - ${req.get("User-Agent")}`);
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
      retryAfter: "15 minutes"
    });
  }
});
var searchRateLimit = rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 20,
  // Limit each IP to 20 search requests per minute
  message: {
    error: "Too many search requests, please slow down.",
    retryAfter: "1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`\u{1F6AB} Rate limit exceeded for search: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: "Too many search requests, please slow down.",
      retryAfter: "1 minute"
    });
  }
});
var apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 100,
  // Limit each IP to 100 requests per minute for general API
  message: {
    error: "Too many requests, please try again later.",
    retryAfter: "1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`\u{1F6AB} Rate limit exceeded for API: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: "Too many requests, please try again later.",
      retryAfter: "1 minute"
    });
  }
});
var adminRateLimit = rateLimit({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 50,
  // Limit admin operations
  message: {
    error: "Too many admin requests, please slow down.",
    retryAfter: "1 minute"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`\u{1F6AB} Admin rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: "Too many admin requests, please slow down.",
      retryAfter: "1 minute"
    });
  }
});
var heavyOperationRateLimit = rateLimit({
  windowMs: 5 * 60 * 1e3,
  // 5 minutes
  max: 10,
  // Only 10 heavy operations per 5 minutes
  message: {
    error: "Too many resource-intensive requests, please wait before trying again.",
    retryAfter: "5 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`\u{1F6AB} Heavy operation rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: "Too many resource-intensive requests, please wait before trying again.",
      retryAfter: "5 minutes"
    });
  }
});
var uploadRateLimit = rateLimit({
  windowMs: 10 * 60 * 1e3,
  // 10 minutes
  max: 20,
  // 20 uploads per 10 minutes
  message: {
    error: "Too many upload attempts, please wait before uploading again.",
    retryAfter: "10 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`\u{1F6AB} Upload rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: "Too many upload attempts, please wait before uploading again.",
      retryAfter: "10 minutes"
    });
  }
});

// server/routes.ts
var sseClients = /* @__PURE__ */ new Set();
function broadcastToSSEClients(event, data) {
  const payload = {
    eventType: event,
    data
  };
  const customEventMessage = `event: ${event}
data: ${JSON.stringify(data)}

`;
  const defaultMessage = `data: ${JSON.stringify(payload)}

`;
  console.log(`\u{1F4E1} Broadcasting ${event} to ${sseClients.size} connected clients:`, data.title || data.id);
  sseClients.forEach((client) => {
    try {
      client.write(customEventMessage);
      client.write(defaultMessage);
    } catch (error) {
      console.error(`\u274C Failed to send ${event} to client:`, error);
      sseClients.delete(client);
    }
  });
}
async function registerRoutes(app2) {
  app2.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  app2.use(populateUser);
  app2.use(sitemap_default);
  registerPerformanceRoutes(app2);
  app2.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, message: "Login successful" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", authRateLimit, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });
  app2.get("/api/auth/wave-balance", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
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
        hasUnlimited: user?.role === "admin" || user?.role === "super_admin"
      });
    } catch (error) {
      console.error("Failed to get wave balance:", error);
      res.status(500).json({ message: "Failed to get wave balance" });
    }
  });
  app2.post("/api/init-db", async (req, res) => {
    try {
      const existingUsers = await storage.getAllUsers();
      if (existingUsers.length > 0) {
        return res.status(400).json({ message: "Database already initialized" });
      }
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
  app2.get("/api/admin/users", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const usersWithoutPasswords = users2.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.delete("/api/admin/properties/all", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const count = await storage.clearAllProperties();
      broadcastToSSEClients("properties_cleared", { count });
      res.json({
        message: `Successfully deleted ${count} properties and related data`,
        deletedCount: count
      });
    } catch (error) {
      console.error("Error clearing all properties:", error);
      res.status(500).json({ message: "Failed to clear all properties" });
    }
  });
  app2.post("/api/admin/properties/reset", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const deletedCount = await storage.clearAllProperties();
      const multilingualProperties = [
        // English Properties
        {
          title: "Luxury Villa in Erbil Center",
          description: "A stunning luxury villa located in the heart of Erbil with modern amenities and spacious rooms. Perfect for families seeking comfort and elegance in a prime location.",
          type: "villa",
          listingType: "sale",
          price: "450000",
          currency: "USD",
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
          language: "en",
          status: "active",
          isFeatured: true,
          images: []
        },
        {
          title: "Modern Apartment in Ankawa",
          description: "Contemporary apartment in the vibrant Ankawa district, featuring modern design and convenient access to restaurants, shopping, and entertainment venues.",
          type: "apartment",
          listingType: "rent",
          price: "800",
          currency: "USD",
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
          language: "en",
          status: "active",
          isFeatured: false,
          images: []
        },
        {
          title: "Commercial Office Space",
          description: "Prime commercial office space in Erbil's business district, ideal for companies and startups. Features modern infrastructure and excellent connectivity.",
          type: "commercial",
          listingType: "rent",
          price: "1200",
          currency: "USD",
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
          language: "en",
          status: "active",
          isFeatured: false,
          images: []
        },
        // Arabic Properties
        {
          title: "\u0641\u064A\u0644\u0627 \u0641\u0627\u062E\u0631\u0629 \u0641\u064A \u0645\u0631\u0643\u0632 \u0623\u0631\u0628\u064A\u0644",
          description: "\u0641\u064A\u0644\u0627 \u0641\u0627\u062E\u0631\u0629 \u0645\u0630\u0647\u0644\u0629 \u062A\u0642\u0639 \u0641\u064A \u0642\u0644\u0628 \u0623\u0631\u0628\u064A\u0644 \u0645\u0639 \u0648\u0633\u0627\u0626\u0644 \u0627\u0644\u0631\u0627\u062D\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629 \u0648\u0627\u0644\u063A\u0631\u0641 \u0627\u0644\u0648\u0627\u0633\u0639\u0629. \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0639\u0627\u0626\u0644\u0627\u062A \u0627\u0644\u062A\u064A \u062A\u0633\u0639\u0649 \u0644\u0644\u0631\u0627\u062D\u0629 \u0648\u0627\u0644\u0623\u0646\u0627\u0642\u0629 \u0641\u064A \u0645\u0648\u0642\u0639 \u0645\u062A\u0645\u064A\u0632.",
          type: "villa",
          listingType: "sale",
          price: "420000",
          currency: "USD",
          bedrooms: 4,
          bathrooms: 3,
          area: 300,
          address: "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629\u060C \u0623\u0631\u0628\u064A\u0644",
          city: "\u0623\u0631\u0628\u064A\u0644",
          country: "\u0627\u0644\u0639\u0631\u0627\u0642",
          latitude: "36.1950",
          longitude: "44.0050",
          amenities: ["\u062D\u0645\u0627\u0645 \u0633\u0628\u0627\u062D\u0629", "\u062D\u062F\u064A\u0642\u0629", "\u0643\u0631\u0627\u062C", "\u0646\u0638\u0627\u0645 \u0623\u0645\u0646\u064A"],
          features: ["\u0645\u0637\u0628\u062E \u062D\u062F\u064A\u062B", "\u062C\u0646\u0627\u062D \u0631\u0626\u064A\u0633\u064A", "\u0634\u0631\u0641\u0629", "\u062A\u0643\u064A\u064A\u0641 \u0645\u0631\u0643\u0632\u064A"],
          language: "ar",
          status: "active",
          isFeatured: true,
          images: []
        },
        {
          title: "\u0634\u0642\u0629 \u062D\u062F\u064A\u062B\u0629 \u0641\u064A \u0639\u0646\u0643\u0627\u0648\u0627",
          description: "\u0634\u0642\u0629 \u0639\u0635\u0631\u064A\u0629 \u0641\u064A \u0645\u0646\u0637\u0642\u0629 \u0639\u0646\u0643\u0627\u0648\u0627 \u0627\u0644\u0646\u0627\u0628\u0636\u0629 \u0628\u0627\u0644\u062D\u064A\u0627\u0629\u060C \u062A\u062A\u0645\u064A\u0632 \u0628\u0627\u0644\u062A\u0635\u0645\u064A\u0645 \u0627\u0644\u062D\u062F\u064A\u062B \u0648\u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0645\u0631\u064A\u062D \u0644\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u0627\u0644\u062A\u0633\u0648\u0642 \u0648\u0623\u0645\u0627\u0643\u0646 \u0627\u0644\u062A\u0631\u0641\u064A\u0647.",
          type: "apartment",
          listingType: "rent",
          price: "750",
          currency: "USD",
          bedrooms: 3,
          bathrooms: 2,
          area: 140,
          address: "\u0645\u0646\u0637\u0642\u0629 \u0639\u0646\u0643\u0627\u0648\u0627\u060C \u0623\u0631\u0628\u064A\u0644",
          city: "\u0623\u0631\u0628\u064A\u0644",
          country: "\u0627\u0644\u0639\u0631\u0627\u0642",
          latitude: "36.2400",
          longitude: "44.0080",
          amenities: ["\u0645\u0648\u0642\u0641 \u0633\u064A\u0627\u0631\u0627\u062A", "\u0645\u0635\u0639\u062F", "\u0634\u0631\u0641\u0629"],
          features: ["\u0645\u062E\u0637\u0637 \u0645\u0641\u062A\u0648\u062D", "\u062A\u062C\u0647\u064A\u0632\u0627\u062A \u062D\u062F\u064A\u062B\u0629", "\u0625\u0637\u0644\u0627\u0644\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u062F\u064A\u0646\u0629"],
          language: "ar",
          status: "active",
          isFeatured: false,
          images: []
        },
        {
          title: "\u0645\u0633\u0627\u062D\u0629 \u0645\u0643\u062A\u0628\u064A\u0629 \u062A\u062C\u0627\u0631\u064A\u0629",
          description: "\u0645\u0633\u0627\u062D\u0629 \u0645\u0643\u062A\u0628\u064A\u0629 \u062A\u062C\u0627\u0631\u064A\u0629 \u0645\u062A\u0645\u064A\u0632\u0629 \u0641\u064A \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629 \u0628\u0623\u0631\u0628\u064A\u0644\u060C \u0645\u062B\u0627\u0644\u064A\u0629 \u0644\u0644\u0634\u0631\u0643\u0627\u062A \u0648\u0627\u0644\u0634\u0631\u0643\u0627\u062A \u0627\u0644\u0646\u0627\u0634\u0626\u0629. \u062A\u062A\u0645\u064A\u0632 \u0628\u0627\u0644\u0628\u0646\u064A\u0629 \u0627\u0644\u062A\u062D\u062A\u064A\u0629 \u0627\u0644\u062D\u062F\u064A\u062B\u0629 \u0648\u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0645\u0645\u062A\u0627\u0632.",
          type: "commercial",
          listingType: "rent",
          price: "1100",
          currency: "USD",
          bedrooms: 0,
          bathrooms: 1,
          area: 180,
          address: "\u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062A\u062C\u0627\u0631\u064A\u0629\u060C \u0623\u0631\u0628\u064A\u0644",
          city: "\u0623\u0631\u0628\u064A\u0644",
          country: "\u0627\u0644\u0639\u0631\u0627\u0642",
          latitude: "36.1800",
          longitude: "44.0100",
          amenities: ["\u0645\u0648\u0642\u0641 \u0633\u064A\u0627\u0631\u0627\u062A", "\u0623\u0645\u0646", "\u0642\u0627\u0639\u0627\u062A \u0627\u062C\u062A\u0645\u0627\u0639\u0627\u062A"],
          features: ["\u0625\u0646\u062A\u0631\u0646\u062A \u0639\u0627\u0644\u064A \u0627\u0644\u0633\u0631\u0639\u0629", "\u0642\u0627\u0639\u0629 \u0645\u0624\u062A\u0645\u0631\u0627\u062A", "\u0645\u0646\u0637\u0642\u0629 \u0627\u0633\u062A\u0642\u0628\u0627\u0644"],
          language: "ar",
          status: "active",
          isFeatured: false,
          images: []
        },
        // Kurdish Properties  
        {
          title: "\u06A4\u06CC\u0644\u0627\u06CC \u0641\u0627\u062E\u0631 \u0644\u06D5 \u0646\u0627\u0648\u06D5\u0646\u062F\u06CC \u0647\u06D5\u0648\u0644\u06CE\u0631",
          description: "\u06A4\u06CC\u0644\u0627\u06CC\u06D5\u06A9\u06CC \u0641\u0627\u062E\u0631 \u0648 \u062C\u0648\u0627\u0646 \u0644\u06D5 \u062F\u06B5\u06CC \u0634\u0627\u0631\u06CC \u0647\u06D5\u0648\u0644\u06CE\u0631\u060C \u062E\u0627\u0648\u06D5\u0646\u06CC \u0626\u0627\u0645\u0631\u0627\u0632\u06D5 \u0646\u0648\u06CE\u06A9\u0627\u0646 \u0648 \u0698\u0648\u0648\u0631\u06CC \u0641\u0631\u0627\u0648\u0627\u0646. \u062A\u06D5\u0648\u0627\u0648 \u06AF\u0648\u0646\u062C\u0627\u0648\u06D5 \u0628\u06C6 \u062E\u06CE\u0632\u0627\u0646\u06D5\u06A9\u0627\u0646 \u06A9\u06D5 \u0628\u06D5\u062F\u0648\u0627\u06CC \u0626\u0627\u0633\u0648\u0648\u062F\u06D5\u06CC\u06CC \u0648 \u062C\u0648\u0627\u0646\u06CC \u062F\u06D5\u06AF\u06D5\u0695\u06CE\u0646.",
          type: "villa",
          listingType: "sale",
          price: "380000",
          currency: "USD",
          bedrooms: 4,
          bathrooms: 3,
          area: 280,
          address: "\u0646\u0627\u0648\u0686\u06D5\u06CC \u0646\u0627\u0648\u06D5\u0646\u062F\u060C \u0647\u06D5\u0648\u0644\u06CE\u0631",
          city: "\u0647\u06D5\u0648\u0644\u06CE\u0631",
          country: "\u0639\u06CE\u0631\u0627\u0642",
          latitude: "36.1930",
          longitude: "44.0070",
          amenities: ["\u062D\u06D5\u0648\u0632\u06CC \u0645\u06D5\u0644\u06D5\u06A9\u0631\u062F\u0646", "\u0628\u0627\u062E\u0686\u06D5", "\u06AF\u0627\u0631\u0627\u062C", "\u0633\u06CC\u0633\u062A\u06D5\u0645\u06CC \u0626\u0627\u0633\u0627\u06CC\u0634"],
          features: ["\u0686\u06CE\u0634\u062A\u062E\u0627\u0646\u06D5\u06CC \u0646\u0648\u06CE", "\u0698\u0648\u0648\u0631\u06CC \u0633\u06D5\u0631\u06D5\u06A9\u06CC", "\u0628\u06D5\u0631\u06D5\u0648\u067E\u06CE\u0634", "\u0626\u06D5\u06CC\u0631\u06CC \u0646\u0627\u0648\u06D5\u0646\u062F"],
          language: "kur",
          status: "active",
          isFeatured: true,
          images: []
        },
        {
          title: "\u0634\u0648\u0642\u06D5\u06CC \u0646\u0648\u06CE \u0644\u06D5 \u0639\u06D5\u0646\u06A9\u0627\u0648\u0627",
          description: "\u0634\u0648\u0642\u06D5\u06CC\u06D5\u06A9\u06CC \u0647\u0627\u0648\u0686\u06D5\u0631\u062E \u0644\u06D5 \u0646\u0627\u0648\u0686\u06D5\u06CC \u0628\u0698\u0648\u0648\u06CC \u0639\u06D5\u0646\u06A9\u0627\u0648\u0627\u060C \u062E\u0627\u0648\u06D5\u0646\u06CC \u062F\u06CC\u0632\u0627\u06CC\u0646\u06CC \u0646\u0648\u06CE \u0648 \u062F\u06D5\u0633\u062A\u06AF\u06D5\u06CC\u0634\u062A\u0646\u06CC \u0626\u0627\u0633\u0627\u0646 \u0628\u06C6 \u0686\u06CE\u0634\u062A\u062E\u0627\u0646\u06D5\u060C \u0628\u0627\u0632\u0627\u0695 \u0648 \u0634\u0648\u06CE\u0646\u06D5\u06A9\u0627\u0646\u06CC \u062E\u06C6\u0634\u06CC.",
          type: "apartment",
          listingType: "rent",
          price: "700",
          currency: "USD",
          bedrooms: 2,
          bathrooms: 1,
          area: 100,
          address: "\u0646\u0627\u0648\u0686\u06D5\u06CC \u0639\u06D5\u0646\u06A9\u0627\u0648\u0627\u060C \u0647\u06D5\u0648\u0644\u06CE\u0631",
          city: "\u0647\u06D5\u0648\u0644\u06CE\u0631",
          country: "\u0639\u06CE\u0631\u0627\u0642",
          latitude: "36.2350",
          longitude: "44.0060",
          amenities: ["\u067E\u0627\u0631\u06A9\u06CC\u0646\u06AF", "\u0626\u0627\u0633\u0627\u0646\u0633\u06C6\u0631", "\u0628\u06D5\u0631\u06D5\u0648\u067E\u06CE\u0634"],
          features: ["\u0646\u06D5\u062E\u0634\u06D5\u06CC \u06A9\u0631\u0627\u0648\u06D5", "\u0626\u0627\u0645\u0631\u0627\u0632\u06CC \u0646\u0648\u06CE", "\u0628\u06CC\u0646\u06CC\u0646\u06CC \u0634\u0627\u0631"],
          language: "kur",
          status: "active",
          isFeatured: false,
          images: []
        },
        {
          title: "\u0634\u0648\u06CE\u0646\u06CC \u06A9\u0627\u0631\u06CC \u0628\u0627\u0632\u0631\u06AF\u0627\u0646\u06CC",
          description: "\u0634\u0648\u06CE\u0646\u06CC \u06A9\u0627\u0631\u06CC \u0628\u0627\u0632\u0631\u06AF\u0627\u0646\u06CC \u0628\u0627\u0634 \u0644\u06D5 \u0646\u0627\u0648\u0686\u06D5\u06CC \u0628\u0627\u0632\u0631\u06AF\u0627\u0646\u06CC \u0647\u06D5\u0648\u0644\u06CE\u0631\u060C \u06AF\u0648\u0646\u062C\u0627\u0648 \u0628\u06C6 \u06A9\u06C6\u0645\u067E\u0627\u0646\u06CC\u0627\u06A9\u0627\u0646 \u0648 \u06A9\u06C6\u0645\u067E\u0627\u0646\u06CC\u0627 \u0646\u0648\u06CE\u06A9\u0627\u0646. \u062E\u0627\u0648\u06D5\u0646\u06CC \u0628\u0646\u06CC\u0627\u062A\u06CC \u0646\u0648\u06CE \u0648 \u067E\u06D5\u06CC\u0648\u06D5\u0646\u062F\u06CC \u0628\u0627\u0634\u06D5.",
          type: "commercial",
          listingType: "rent",
          price: "1000",
          currency: "USD",
          bedrooms: 0,
          bathrooms: 1,
          area: 150,
          address: "\u0646\u0627\u0648\u0686\u06D5\u06CC \u0628\u0627\u0632\u0631\u06AF\u0627\u0646\u06CC\u060C \u0647\u06D5\u0648\u0644\u06CE\u0631",
          city: "\u0647\u06D5\u0648\u0644\u06CE\u0631",
          country: "\u0639\u06CE\u0631\u0627\u0642",
          latitude: "36.1750",
          longitude: "44.0110",
          amenities: ["\u067E\u0627\u0631\u06A9\u06CC\u0646\u06AF", "\u0626\u0627\u0633\u0627\u06CC\u0634", "\u0698\u0648\u0648\u0631\u06CC \u06A9\u06C6\u0628\u0648\u0648\u0646\u06D5\u0648\u06D5"],
          features: ["\u0626\u06CC\u0646\u062A\u06D5\u0631\u0646\u06CE\u062A\u06CC \u062E\u06CE\u0631\u0627", "\u0698\u0648\u0648\u0631\u06CC \u06A9\u06C6\u0646\u0641\u0631\u0627\u0646\u0633", "\u0646\u0627\u0648\u0686\u06D5\u06CC \u067E\u06CE\u0634\u0648\u0627\u0632\u06CC"],
          language: "kur",
          status: "active",
          isFeatured: false,
          images: []
        }
      ];
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
      broadcastToSSEClients("properties_reset", {
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
  app2.get("/api/admin/users/with-passwords", requireRole("admin"), async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users with passwords" });
    }
  });
  app2.post("/api/admin/users", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const processedBody = { ...req.body };
      if (processedBody.expiresAt) {
        if (typeof processedBody.expiresAt === "string" && processedBody.expiresAt.trim() !== "") {
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
      if (processedBody.allowedLanguages && req.user?.role !== "super_admin") {
        return res.status(403).json({
          message: "Only super admins can set language permissions"
        });
      }
      if (!processedBody.allowedLanguages && req.user?.role === "super_admin") {
        processedBody.allowedLanguages = ["en"];
      }
      const validatedData = insertUserSchema.parse(processedBody);
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.put("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const processedBody = { ...req.body };
      if (processedBody.expiresAt) {
        if (typeof processedBody.expiresAt === "string" && processedBody.expiresAt.trim() !== "") {
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
      if (processedBody.allowedLanguages && req.user?.role !== "super_admin") {
        return res.status(403).json({
          message: "Only super admins can modify language permissions"
        });
      }
      const validatedData = insertUserSchema.partial().parse(processedBody);
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.delete("/api/admin/users/:id", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
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
  app2.post("/api/admin/update-customer-wave-balance", requireRole("admin"), async (req, res) => {
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
  app2.put("/api/admin/users/:id/wave-balance", requireRole("admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const { waveBalance } = req.body;
      if (typeof waveBalance !== "number" || waveBalance < 0) {
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
  app2.get("/api/admin/currency-rates", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const rates = await storage.getCurrencyRates();
      res.json(rates);
    } catch (error) {
      console.error("Get currency rates error:", error);
      res.status(500).json({ message: "Failed to fetch currency rates" });
    }
  });
  app2.get("/api/admin/currency-rates/active", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const rates = await storage.getActiveCurrencyRates();
      res.json(rates);
    } catch (error) {
      console.error("Get active currency rates error:", error);
      res.status(500).json({ message: "Failed to fetch active currency rates" });
    }
  });
  app2.post("/api/admin/currency-rates", adminRateLimit, requireRole("admin"), async (req, res) => {
    try {
      const validatedData = insertCurrencyRateSchema.parse({
        ...req.body,
        setBy: req.user?.id || "unknown"
      });
      const newRate = await storage.createCurrencyRate(validatedData);
      res.status(201).json(newRate);
    } catch (error) {
      console.error("Create currency rate error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid currency rate data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create currency rate" });
    }
  });
  app2.put("/api/admin/currency-rates/:id", adminRateLimit, requireRole("admin"), async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid currency rate data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update currency rate" });
    }
  });
  app2.delete("/api/admin/currency-rates/:id", adminRateLimit, requireRole("admin"), async (req, res) => {
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
  app2.get("/api/currency/convert", apiRateLimit, async (req, res) => {
    try {
      const { amount, from, to } = req.query;
      if (!amount || !from || !to) {
        return res.status(400).json({
          message: "Missing required parameters: amount, from, to"
        });
      }
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const convertedAmount = await storage.convertPrice(numAmount, from, to);
      res.json({
        originalAmount: numAmount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Currency conversion error:", error);
      res.status(500).json({ message: "Failed to convert currency" });
    }
  });
  app2.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const allowedFields = ["firstName", "lastName", "phone", "avatar"];
      const updateData = {};
      Object.keys(req.body).forEach((key) => {
        if (allowedFields.includes(key) && req.body[key] !== void 0) {
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
  app2.get(
    "/api/properties",
    apiRateLimit,
    cacheControl({ maxAge: 0 }),
    // No caching for real-time updates
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
          type,
          listingType,
          minPrice: minPrice ? parseFloat(minPrice) : void 0,
          maxPrice: maxPrice ? parseFloat(maxPrice) : void 0,
          bedrooms: bedrooms ? parseInt(bedrooms) : void 0,
          bathrooms: bathrooms ? parseInt(bathrooms) : void 0,
          city,
          country,
          language,
          search,
          sortBy,
          sortOrder,
          limit: parseInt(limit),
          offset: parseInt(offset)
        };
        const properties2 = await storage.getProperties(filters);
        res.json(properties2);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch properties" });
      }
    }
  );
  app2.get(
    "/api/properties/featured",
    cacheControl({ maxAge: 600 }),
    // Cache for 10 minutes
    async (req, res) => {
      try {
        const properties2 = await storage.getFeaturedProperties();
        try {
          if (handleConditionalRequest(req, res, properties2)) {
            return;
          }
        } catch (error) {
          console.warn("Conditional request handling failed:", error);
        }
        res.json(properties2);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch featured properties" });
      }
    }
  );
  app2.get("/api/properties/stream", (req, res) => {
    console.log("\u{1F50C} New SSE connection established");
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Keep-Alive": "timeout=60, max=1000",
      "Content-Encoding": "identity",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
      "X-Accel-Buffering": "no"
      // Prevent buffering by Nginx
    });
    res.flushHeaders();
    res.write(":" + " ".repeat(2048) + "\n");
    res.write("retry: 10000\n\n");
    if (res.flush) res.flush();
    console.log("\u{1F4E1} SSE padding sent, forcing stream start");
    res.write(`data: ${JSON.stringify({ type: "connected", message: "SSE connection established" })}

`);
    if (res.flush) res.flush();
    console.log("\u{1F4E1} SSE initial connection message sent and flushed");
    sseClients.add(res);
    console.log(`\u{1F4CA} SSE clients connected: ${sseClients.size}`);
    const heartbeat = setInterval(() => {
      try {
        const heartbeatData = `data: ${JSON.stringify({ type: "heartbeat", timestamp: (/* @__PURE__ */ new Date()).toISOString() })}

`;
        res.write(heartbeatData);
        if (res.flush) res.flush();
        console.log("\u{1F493} SSE heartbeat sent and flushed");
      } catch (error) {
        console.log("\u{1F494} SSE heartbeat failed, removing client:", error.message);
        clearInterval(heartbeat);
        sseClients.delete(res);
        console.log(`\u{1F4CA} SSE clients connected: ${sseClients.size}`);
      }
    }, 15e3);
    req.on("close", () => {
      console.log("\u{1F50C} SSE client disconnected (close)");
      clearInterval(heartbeat);
      sseClients.delete(res);
      console.log(`\u{1F4CA} SSE clients connected: ${sseClients.size}`);
    });
    req.on("error", (error) => {
      console.log("\u{1F50C} SSE client disconnected (error):", error.message);
      clearInterval(heartbeat);
      sseClients.delete(res);
      console.log(`\u{1F4CA} SSE clients connected: ${sseClients.size}`);
    });
  });
  app2.get("/api/properties/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      console.log(`\u{1F50D} Fetching property with ID or slug: ${idOrSlug}`);
      let property = await storage.getPropertyBySlug(idOrSlug);
      if (!property) {
        console.log(`\u{1F504} Slug lookup failed, trying ID lookup for: ${idOrSlug}`);
        property = await storage.getProperty(idOrSlug);
      }
      if (!property) {
        console.log(`\u274C Property not found with slug or ID: ${idOrSlug}`);
        return res.status(404).json({ message: "Property not found" });
      }
      await storage.incrementPropertyViews(property.id);
      console.log(`\u2705 Property found: ${property.title}`);
      res.json(property);
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });
  app2.post("/api/properties", requireAnyRole(["user", "admin"]), validateLanguagePermission, async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      broadcastToSSEClients("property_created", property);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create property" });
    }
  });
  app2.put("/api/properties/:id", requireAnyRole(["user", "admin"]), validateLanguagePermission, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updatePropertySchema.parse(req.body);
      const property = await storage.updateProperty(id, validatedData);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      broadcastToSSEClients("property_updated", property);
      res.json(property);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid property data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update property" });
    }
  });
  app2.delete("/api/properties/:id", requireAnyRole(["user", "admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (user.role !== "admin" && user.role !== "super_admin" && property.agentId !== user.id) {
        return res.status(403).json({ message: "Forbidden: You can only delete your own properties" });
      }
      const deleted = await storage.deleteProperty(id);
      if (!deleted) {
        return res.status(404).json({ message: "Property not found" });
      }
      broadcastToSSEClients("property_deleted", { id, title: property.title });
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete property" });
    }
  });
  app2.get("/api/users/:userId/properties", async (req, res) => {
    try {
      const { userId } = req.params;
      const allProperties = await storage.getProperties();
      const properties2 = allProperties.filter((p) => p.agentId === userId);
      res.json(properties2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user properties" });
    }
  });
  app2.post("/api/inquiries", async (req, res) => {
    try {
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid inquiry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inquiry" });
    }
  });
  app2.get("/api/properties/:propertyId/inquiries", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const inquiries2 = await storage.getInquiriesForProperty(propertyId);
      res.json(inquiries2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inquiries" });
    }
  });
  app2.put("/api/inquiries/:id/status", async (req, res) => {
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
  app2.get("/api/users/:userId/favorites", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites2 = await storage.getFavoritesByUser(userId);
      res.json(favorites2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app2.post("/api/favorites", async (req, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse(req.body);
      const favorite = await storage.addToFavorites(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid favorite data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });
  app2.delete("/api/favorites", async (req, res) => {
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
  app2.get("/api/favorites/check", async (req, res) => {
    try {
      const { userId, propertyId } = req.query;
      if (!userId || !propertyId) {
        return res.status(400).json({ message: "userId and propertyId are required" });
      }
      const isFavorite = await storage.isFavorite(userId, propertyId);
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });
  app2.post("/api/search/ai", searchRateLimit, async (req, res) => {
    try {
      const { query, userId } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }
      const searchTerms = query.toLowerCase();
      const filters = {};
      const priceMatch = searchTerms.match(/under\s+\$?([\d,]+)|below\s+\$?([\d,]+)|less\s+than\s+\$?([\d,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]?.replace(",", "") || priceMatch[2]?.replace(",", "") || priceMatch[3]?.replace(",", ""));
        filters.maxPrice = price;
      }
      const bedroomMatch = searchTerms.match(/(\d+)\s*bed/);
      if (bedroomMatch) {
        filters.bedrooms = parseInt(bedroomMatch[1]);
      }
      if (searchTerms.includes("house")) filters.type = "house";
      if (searchTerms.includes("apartment")) filters.type = "apartment";
      if (searchTerms.includes("villa")) filters.type = "villa";
      if (searchTerms.includes("rent")) filters.listingType = "rent";
      if (searchTerms.includes("buy") || searchTerms.includes("sale")) filters.listingType = "sale";
      const locations = ["erbil", "baghdad", "sulaymaniyah", "kurdistan", "iraq"];
      for (const location of locations) {
        if (searchTerms.includes(location)) {
          filters.city = location;
          break;
        }
      }
      filters.search = query;
      const properties2 = await trackQueryPerformance(
        "getPropertiesForSearch",
        () => storage.getProperties(filters)
      );
      if (userId) {
        await storage.addSearchHistory({
          userId,
          query,
          filters,
          results: properties2.length
        });
      }
      res.json({
        query,
        filters,
        results: properties2,
        count: properties2.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform AI search" });
    }
  });
  app2.get("/api/search/suggestions", async (req, res) => {
    try {
      const suggestions = [
        "Show me apartments under $150k in Erbil",
        "Find family homes with gardens near schools",
        "Luxury properties with mountain views",
        "3-bedroom houses under $200k",
        "Modern apartments for rent in Baghdad",
        "Villas with swimming pools in Kurdistan"
      ];
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });
  app2.post("/api/customers/:userId/activity", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { activityType, propertyId, metadata, points } = req.body;
      const activity = await storage.addCustomerActivity({
        userId,
        activityType,
        propertyId: propertyId || null,
        metadata: metadata || {},
        points: points || 0
      });
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to add customer activity" });
    }
  });
  app2.get("/api/customers/:userId/activities", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const activities = await storage.getCustomerActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer activities" });
    }
  });
  app2.get("/api/customers/:userId/points", requireRole("admin"), async (req, res) => {
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
  app2.get("/api/customers/:userId/analytics", requireRole("admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const analytics = await storage.getCustomerAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer analytics" });
    }
  });
  app2.put("/api/customers/:userId/points", requireRole("admin"), async (req, res) => {
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
  app2.post("/api/seed/users", async (req, res) => {
    try {
      const existingSuperAdmin = await storage.getUserByUsername("superadmin");
      const existingUser = await storage.getUserByUsername("john_doe");
      const createdUsers = [];
      if (!existingSuperAdmin) {
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
  app2.get("/api/waves", requireAuth, async (req, res) => {
    try {
      const waves2 = await storage.getWaves();
      res.json(waves2);
    } catch (error) {
      console.error("Error fetching waves:", error);
      res.status(500).json({ message: "Failed to fetch waves" });
    }
  });
  app2.post("/api/waves", requireRole("super_admin"), async (req, res) => {
    try {
      const validatedData = insertWaveSchema.parse(req.body);
      const wave = await storage.createWave({
        ...validatedData,
        createdBy: req.session.userId
      });
      res.status(201).json(wave);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid wave data", errors: error.errors });
      }
      console.error("Error creating wave:", error);
      res.status(500).json({ message: "Failed to create wave" });
    }
  });
  app2.put("/api/waves/:id", requireRole("super_admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertWaveSchema.partial().parse(req.body);
      const wave = await storage.updateWave(id, validatedData);
      if (!wave) {
        return res.status(404).json({ message: "Wave not found" });
      }
      res.json(wave);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid wave data", errors: error.errors });
      }
      console.error("Error updating wave:", error);
      res.status(500).json({ message: "Failed to update wave" });
    }
  });
  app2.delete("/api/waves/:id", requireRole("super_admin"), async (req, res) => {
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
  app2.get("/api/customers/:userId/wave-permissions", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const currentUser = await storage.getUser(req.session.userId);
      if (req.session.userId !== userId && currentUser?.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const permissions = await storage.getCustomerWavePermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching wave permissions:", error);
      res.status(500).json({ message: "Failed to fetch wave permissions" });
    }
  });
  app2.post("/api/customers/:userId/wave-permissions", requireRole("super_admin"), async (req, res) => {
    try {
      const { userId } = req.params;
      const { waveId, maxProperties } = req.body;
      const permission = await storage.grantWavePermission({
        userId,
        waveId,
        maxProperties: maxProperties || 1,
        usedProperties: 0,
        grantedBy: req.session.userId
      });
      res.status(201).json(permission);
    } catch (error) {
      console.error("Error granting wave permission:", error);
      res.status(500).json({ message: "Failed to grant wave permission" });
    }
  });
  app2.put("/api/customers/:userId/wave-permissions/:waveId", requireRole("super_admin"), async (req, res) => {
    try {
      const { userId, waveId } = req.params;
      const { maxProperties } = req.body;
      const permission = await storage.getWavePermission(userId, waveId);
      if (!permission) {
        return res.status(404).json({ message: "Wave permission not found" });
      }
      const updated = await storage.updateWavePermission(permission.id, {
        maxProperties,
        grantedBy: req.session.userId
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating wave permission:", error);
      res.status(500).json({ message: "Failed to update wave permission" });
    }
  });
  app2.delete("/api/customers/:userId/wave-permissions/:waveId", requireRole("super_admin"), async (req, res) => {
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
  app2.get("/api/waves/:waveId/properties", requireAuth, async (req, res) => {
    try {
      const { waveId } = req.params;
      const properties2 = await storage.getPropertiesByWave(waveId);
      res.json(properties2);
    } catch (error) {
      console.error("Error fetching wave properties:", error);
      res.status(500).json({ message: "Failed to fetch wave properties" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import fs2 from "fs";
import path3 from "path";
var app = express2();
app.set("trust proxy", 1);
app.use(compression({
  // Compress responses larger than 1kb
  threshold: 1024,
  // Set compression level (6 is good balance of speed/compression)
  level: 6,
  // Compress these MIME types
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use(requestSizeMonitor(10));
app.use(performanceLogger);
function isSocialMediaBot(userAgent) {
  const botPatterns = [
    "facebookexternalhit",
    "twitterbot",
    "linkedinbot",
    "whatsapp",
    "skypeuripreview",
    "discordbot",
    "slackbot",
    "telegrambot"
  ];
  const lowerUserAgent = userAgent.toLowerCase();
  return botPatterns.some((pattern) => lowerUserAgent.includes(pattern));
}
var htmlTemplate = null;
function escapeHtml(text2) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  };
  return text2.replace(/[&<>"']/g, (m) => map[m]);
}
async function injectPropertyMetaTags(req, res, next) {
  const propertyMatch = req.path.match(/^(?:\/(en|ar|kur))?\/property\/(.+)$/);
  if (!propertyMatch) {
    return next();
  }
  const userAgent = req.get("User-Agent") || "";
  if (!isSocialMediaBot(userAgent)) {
    return next();
  }
  const propertyId = propertyMatch[2];
  try {
    let property = await storage.getPropertyBySlug(propertyId);
    if (!property) {
      console.log(`\u{1F504} Slug lookup failed for social crawler, trying ID lookup for: ${propertyId}`);
      property = await storage.getProperty(propertyId);
    }
    if (!property) {
      console.log(`\u274C Property not found for social crawler with slug or ID: ${propertyId}`);
      return next();
    }
    if (!htmlTemplate) {
      const htmlPath = path3.join(process.cwd(), "client", "index.html");
      htmlTemplate = fs2.readFileSync(htmlPath, "utf-8");
    }
    let html = htmlTemplate;
    const formatPrice = (price, currency, listingType) => {
      const amount = parseFloat(price);
      const formattedAmount = new Intl.NumberFormat().format(amount);
      const suffix = listingType === "rent" ? "/mo" : "";
      return `${currency === "USD" ? "$" : currency}${formattedAmount}${suffix}`;
    };
    const protocol = req.get("X-Forwarded-Proto") || req.protocol || "https";
    const propertyTitle = escapeHtml(`${property.title} - ${formatPrice(property.price, property.currency || "USD", property.listingType)} | MapEstate`);
    const propertyDescription = escapeHtml(`${property.description || `${property.bedrooms} bedroom ${property.type} for ${property.listingType} in ${property.city}, ${property.country}.`} View details, photos, and contact information.`);
    const propertyImage = property.images && property.images.length > 0 ? property.images[0].startsWith("http") ? property.images[0] : `${protocol}://${req.get("host")}${property.images[0]}` : `${protocol}://${req.get("host")}/logo_1757848527935.png`;
    const languagePrefix = propertyMatch[1] ? `/${propertyMatch[1]}` : "";
    const propertyUrl = `${protocol}://${req.get("host")}${languagePrefix}/property/${property.slug || property.id}`;
    const secureImageUrl = propertyImage.replace("http://", "https://");
    const socialMetaTags = `
    <!-- Property-specific meta tags for social media crawlers -->
    <title>${propertyTitle}</title>
    <meta name="title" content="${propertyTitle}" />
    <meta name="description" content="${propertyDescription}" />
    <link rel="canonical" href="${propertyUrl}" />
    
    <!-- Open Graph / Facebook / LinkedIn -->
    <meta property="og:type" content="product" />
    <meta property="og:title" content="${propertyTitle}" />
    <meta property="og:description" content="${propertyDescription}" />
    <meta property="og:image" content="${propertyImage}" />
    <meta property="og:image:secure_url" content="${secureImageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(property.title)}" />
    <meta property="og:url" content="${propertyUrl}" />
    <meta property="og:site_name" content="MapEstate" />
    <meta property="og:locale" content="en_US" />
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${propertyTitle}" />
    <meta name="twitter:description" content="${propertyDescription}" />
    <meta name="twitter:image" content="${propertyImage}" />
    <meta name="twitter:image:alt" content="${escapeHtml(property.title)}" />
    <meta name="twitter:site" content="@MapEstate" />
    <meta name="twitter:creator" content="@MapEstate" />
    
    <!-- Additional meta tags -->
    <meta name="robots" content="index, follow" />
    <meta name="author" content="MapEstate" />
    `;
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": property.title,
      "description": property.description || `${property.bedrooms} bedroom ${property.type} in ${property.city}`,
      "image": propertyImage,
      "url": propertyUrl,
      "offers": {
        "@type": "Offer",
        "price": property.price,
        "priceCurrency": property.currency || "USD",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "MapEstate"
        }
      },
      "category": property.type,
      "location": {
        "@type": "Place",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": property.address,
          "addressLocality": property.city,
          "addressCountry": property.country
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": property.latitude,
          "longitude": property.longitude
        }
      }
    };
    const jsonLd = JSON.stringify(structuredData, null, 6).replace(/<\/script>/gi, "<\\/script>");
    const structuredDataScript = `
    <script type="application/ld+json">
${jsonLd}
    </script>
`;
    html = html.replace("</head>", `${socialMetaTags}${structuredDataScript}  </head>`);
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error) {
    console.error("Error injecting property meta tags:", error);
    next();
  }
}
app.use(injectPropertyMetaTags);
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
