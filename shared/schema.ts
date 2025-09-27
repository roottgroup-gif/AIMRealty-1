import { sql, relations } from "drizzle-orm";
import { mysqlTable, text, varchar, int, decimal, boolean, timestamp } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Language constants
export const SUPPORTED_LANGUAGES = ["en", "ar", "kur"] as const;
export const LANGUAGE_NAMES = {
  en: "English",
  ar: "Arabic", 
  kur: "Kurdish Sorani"
} as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Users table (no JSON columns)
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 191 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  avatar: text("avatar"),
  isVerified: boolean("is_verified").default(false),
  waveBalance: int("wave_balance").default(10),
  expiresAt: timestamp("expires_at"),
  isExpired: boolean("is_expired").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User languages table (normalized from users.allowed_languages JSON)
export const userLanguages = mysqlTable("user_languages", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  language: varchar("language", { length: 3 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserLanguage: sql`UNIQUE KEY unique_user_language (user_id, language)`,
}));

// Waves table
export const waves = mysqlTable("waves", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Properties table (no JSON columns)
export const properties = mysqlTable("properties", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  listingType: varchar("listing_type", { length: 20 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  area: int("area"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  status: varchar("status", { length: 16 }).default("active"),
  language: varchar("language", { length: 3 }).notNull().default("en"),
  agentId: varchar("agent_id", { length: 36 }).references(() => users.id),
  contactPhone: varchar("contact_phone", { length: 20 }),
  waveId: varchar("wave_id", { length: 36 }).references(() => waves.id),
  views: int("views").default(0),
  isFeatured: boolean("is_featured").default(false),
  slug: varchar("slug", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Property images table (normalized from properties.images JSON)
export const propertyImages = mysqlTable("property_images", {
  id: int("id").primaryKey().autoincrement(),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(),
  sortOrder: int("sort_order").default(0),
  altText: varchar("alt_text", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property amenities table (normalized from properties.amenities JSON)
export const propertyAmenities = mysqlTable("property_amenities", {
  id: int("id").primaryKey().autoincrement(),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id, { onDelete: 'cascade' }),
  amenity: varchar("amenity", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniquePropertyAmenity: sql`UNIQUE KEY unique_property_amenity (property_id, amenity)`,
}));

// Property features table (normalized from properties.features JSON)
export const propertyFeatures = mysqlTable("property_features", {
  id: int("id").primaryKey().autoincrement(),
  propertyId: varchar("property_id", { length: 36 }).notNull().references(() => properties.id, { onDelete: 'cascade' }),
  feature: varchar("feature", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniquePropertyFeature: sql`UNIQUE KEY unique_property_feature (property_id, feature)`,
}));

// Inquiries table
export const inquiries = mysqlTable("inquiries", {
  id: varchar("id", { length: 36 }).primaryKey(),
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 16 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Favorites table
export const favorites = mysqlTable("favorites", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserPropertyFavorite: sql`UNIQUE KEY unique_user_property_favorite (user_id, property_id)`,
}));

// Search history table
export const searchHistory = mysqlTable("search_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  query: text("query").notNull(),
  results: int("results").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Search filters table (normalized from search_history.filters JSON)
export const searchFilters = mysqlTable("search_filters", {
  id: int("id").primaryKey().autoincrement(),
  searchId: varchar("search_id", { length: 36 }).notNull().references(() => searchHistory.id, { onDelete: 'cascade' }),
  filterKey: varchar("filter_key", { length: 50 }).notNull(),
  filterValue: varchar("filter_value", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer activity table
export const customerActivity = mysqlTable("customer_activity", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  propertyId: varchar("property_id", { length: 36 }).references(() => properties.id),
  points: int("points").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity metadata table (normalized from customer_activity.metadata JSON)
export const activityMetadata = mysqlTable("activity_metadata", {
  id: int("id").primaryKey().autoincrement(),
  activityId: varchar("activity_id", { length: 36 }).notNull().references(() => customerActivity.id, { onDelete: 'cascade' }),
  metadataKey: varchar("metadata_key", { length: 50 }).notNull(),
  metadataValue: text("metadata_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer points table
export const customerPoints = mysqlTable("customer_points", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id),
  totalPoints: int("total_points").default(0),
  currentLevel: varchar("current_level", { length: 20 }).default("Bronze"),
  pointsThisMonth: int("points_this_month").default(0),
  lastActivity: timestamp("last_activity").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Currency rates table
export const currencyRates = mysqlTable("currency_rates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull().default("USD"),
  toCurrency: varchar("to_currency", { length: 3 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(),
  isActive: boolean("is_active").default(true),
  setBy: varchar("set_by", { length: 36 }).references(() => users.id),
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Client locations table (no JSON metadata)
export const clientLocations = mysqlTable("client_locations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  accuracy: int("accuracy"),
  source: varchar("source", { length: 32 }).default("map_button"),
  userAgent: text("user_agent"),
  language: varchar("language", { length: 10 }),
  permissionStatus: varchar("permission_status", { length: 20 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer wave permissions table
export const customerWavePermissions = mysqlTable("customer_wave_permissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  waveId: varchar("wave_id", { length: 36 }).notNull().references(() => waves.id),
  maxProperties: int("max_properties").notNull().default(1),
  usedProperties: int("used_properties").default(0),
  grantedBy: varchar("granted_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  inquiries: many(inquiries),
  favorites: many(favorites),
  searchHistory: many(searchHistory),
  customerActivity: many(customerActivity),
  customerPoints: many(customerPoints),
  wavePermissions: many(customerWavePermissions),
  createdWaves: many(waves),
  clientLocations: many(clientLocations),
  userLanguages: many(userLanguages),
}));

export const userLanguagesRelations = relations(userLanguages, ({ one }) => ({
  user: one(users, {
    fields: [userLanguages.userId],
    references: [users.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  agent: one(users, {
    fields: [properties.agentId],
    references: [users.id],
  }),
  wave: one(waves, {
    fields: [properties.waveId],
    references: [waves.id],
  }),
  inquiries: many(inquiries),
  favorites: many(favorites),
  images: many(propertyImages),
  amenities: many(propertyAmenities),
  features: many(propertyFeatures),
}));

export const propertyImagesRelations = relations(propertyImages, ({ one }) => ({
  property: one(properties, {
    fields: [propertyImages.propertyId],
    references: [properties.id],
  }),
}));

export const propertyAmenitiesRelations = relations(propertyAmenities, ({ one }) => ({
  property: one(properties, {
    fields: [propertyAmenities.propertyId],
    references: [properties.id],
  }),
}));

export const propertyFeaturesRelations = relations(propertyFeatures, ({ one }) => ({
  property: one(properties, {
    fields: [propertyFeatures.propertyId],
    references: [properties.id],
  }),
}));

export const wavesRelations = relations(waves, ({ one, many }) => ({
  properties: many(properties),
  permissions: many(customerWavePermissions),
  createdBy: one(users, {
    fields: [waves.createdBy],
    references: [users.id],
  }),
}));

export const customerWavePermissionsRelations = relations(customerWavePermissions, ({ one }) => ({
  user: one(users, {
    fields: [customerWavePermissions.userId],
    references: [users.id],
  }),
  wave: one(waves, {
    fields: [customerWavePermissions.waveId],
    references: [waves.id],
  }),
  grantedBy: one(users, {
    fields: [customerWavePermissions.grantedBy],
    references: [users.id],
  }),
}));

export const currencyRatesRelations = relations(currencyRates, ({ one }) => ({
  setBy: one(users, {
    fields: [currencyRates.setBy],
    references: [users.id],
  }),
}));

export const clientLocationsRelations = relations(clientLocations, ({ one }) => ({
  user: one(users, {
    fields: [clientLocations.userId],
    references: [users.id],
  }),
}));

export const inquiriesRelations = relations(inquiries, ({ one }) => ({
  property: one(properties, {
    fields: [inquiries.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [inquiries.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [favorites.propertyId],
    references: [properties.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one, many }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
  }),
  filters: many(searchFilters),
}));

export const searchFiltersRelations = relations(searchFilters, ({ one }) => ({
  search: one(searchHistory, {
    fields: [searchFilters.searchId],
    references: [searchHistory.id],
  }),
}));

export const customerActivityRelations = relations(customerActivity, ({ one, many }) => ({
  user: one(users, {
    fields: [customerActivity.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [customerActivity.propertyId],
    references: [properties.id],
  }),
  metadata: many(activityMetadata),
}));

export const activityMetadataRelations = relations(activityMetadata, ({ one }) => ({
  activity: one(customerActivity, {
    fields: [activityMetadata.activityId],
    references: [customerActivity.id],
  }),
}));

export const customerPointsRelations = relations(customerPoints, ({ one }) => ({
  user: one(users, {
    fields: [customerPoints.userId],
    references: [users.id],
  }),
}));

// Insert schemas (without JSON validation)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isExpired: true,
});

export const insertUserLanguageSchema = createInsertSchema(userLanguages).omit({
  id: true,
  createdAt: true,
}).extend({
  language: z.enum(SUPPORTED_LANGUAGES),
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  slug: true,
}).extend({
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
});

export const updatePropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  slug: true,
}).extend({
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
}).partial();

export const insertPropertyImageSchema = createInsertSchema(propertyImages).omit({
  id: true,
  createdAt: true,
});

export const insertPropertyAmenitySchema = createInsertSchema(propertyAmenities).omit({
  id: true,
  createdAt: true,
});

export const insertPropertyFeatureSchema = createInsertSchema(propertyFeatures).omit({
  id: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).omit({
  id: true,
  createdAt: true,
});

export const insertSearchFilterSchema = createInsertSchema(searchFilters).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerActivitySchema = createInsertSchema(customerActivity).omit({
  id: true,
  createdAt: true,
});

export const insertActivityMetadataSchema = createInsertSchema(activityMetadata).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerPointsSchema = createInsertSchema(customerPoints).omit({
  id: true,
  lastActivity: true,
  updatedAt: true,
});

export const insertWaveSchema = createInsertSchema(waves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerWavePermissionSchema = createInsertSchema(customerWavePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  effectiveDate: true,
});

export const updateCurrencyRateSchema = createInsertSchema(currencyRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  effectiveDate: true,
}).partial();

export const insertClientLocationSchema = createInsertSchema(clientLocations).omit({
  id: true,
  createdAt: true,
}).extend({
  latitude: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'number' ? v.toFixed(8) : v
  ),
  longitude: z.union([z.number(), z.string()]).transform(v => 
    typeof v === 'number' ? v.toFixed(8) : v
  ),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserLanguage = typeof userLanguages.$inferSelect;
export type InsertUserLanguage = z.infer<typeof insertUserLanguageSchema>;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = z.infer<typeof insertPropertyImageSchema>;
export type PropertyAmenity = typeof propertyAmenities.$inferSelect;
export type InsertPropertyAmenity = z.infer<typeof insertPropertyAmenitySchema>;
export type PropertyFeature = typeof propertyFeatures.$inferSelect;
export type InsertPropertyFeature = z.infer<typeof insertPropertyFeatureSchema>;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type SearchFilter = typeof searchFilters.$inferSelect;
export type InsertSearchFilter = z.infer<typeof insertSearchFilterSchema>;
export type CustomerActivity = typeof customerActivity.$inferSelect;
export type InsertCustomerActivity = z.infer<typeof insertCustomerActivitySchema>;
export type ActivityMetadata = typeof activityMetadata.$inferSelect;
export type InsertActivityMetadata = z.infer<typeof insertActivityMetadataSchema>;
export type CustomerPoints = typeof customerPoints.$inferSelect;
export type InsertCustomerPoints = z.infer<typeof insertCustomerPointsSchema>;
export type Wave = typeof waves.$inferSelect;
export type InsertWave = z.infer<typeof insertWaveSchema>;
export type CustomerWavePermission = typeof customerWavePermissions.$inferSelect;
export type InsertCustomerWavePermission = z.infer<typeof insertCustomerWavePermissionSchema>;
export type CurrencyRate = typeof currencyRates.$inferSelect;
export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
export type UpdateCurrencyRate = z.infer<typeof updateCurrencyRateSchema>;
export type ClientLocation = typeof clientLocations.$inferSelect;
export type InsertClientLocation = z.infer<typeof insertClientLocationSchema>;

// Property with relations
export type PropertyWithDetails = Property & {
  agent: User | null;
  wave: Wave | null;
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  features: PropertyFeature[];
  inquiries: Inquiry[];
  favorites: Favorite[];
};

// User with relations
export type UserWithLanguages = User & {
  userLanguages: UserLanguage[];
};

// Wave with permissions
export type WaveWithPermissions = Wave & {
  permissions: CustomerWavePermission[];
  properties: Property[];
};

// Property filters type
export interface PropertyFilters {
  type?: string;
  listingType?: "sale" | "rent";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  country?: string;
  language?: Language;
  features?: string[];
  amenities?: string[];
  search?: string;
  sortBy?: "price" | "date" | "views";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}