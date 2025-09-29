import { 
  users, properties, inquiries, favorites, searchHistory, customerActivity, customerPoints,
  waves, customerWavePermissions, currencyRates, clientLocations,
  userLanguages, propertyImages, propertyAmenities, propertyFeatures,
  searchFilters, activityMetadata,
  type User, type InsertUser, type UserLanguage, type InsertUserLanguage,
  type Property, type InsertProperty, type PropertyWithDetails,
  type PropertyImage, type InsertPropertyImage,
  type PropertyAmenity, type InsertPropertyAmenity,
  type PropertyFeature, type InsertPropertyFeature,
  type Inquiry, type InsertInquiry,
  type Favorite, type InsertFavorite,
  type SearchHistory, type InsertSearchHistory,
  type SearchFilter, type InsertSearchFilter,
  type CustomerActivity, type InsertCustomerActivity,
  type ActivityMetadata, type InsertActivityMetadata,
  type CustomerPoints, type InsertCustomerPoints,
  type Wave, type InsertWave,
  type CustomerWavePermission, type InsertCustomerWavePermission,
  type CurrencyRate, type InsertCurrencyRate, type UpdateCurrencyRate,
  type ClientLocation, type InsertClientLocation,
  type PropertyFilters
} from "@shared/schema";

// Utility function to sanitize user data for API responses
function sanitizeUser(user: User | null | undefined): Omit<User, 'password'> | null {
  if (!user) return null;
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}
import { db } from "./db";
import { MemStorage } from "./memStorage";
import { eq, and, like, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { generatePropertySlug, generateUniqueSlug } from "@shared/slug-utils";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUserLanguages(userId: string): Promise<UserLanguage[]>;
  addUserLanguage(userId: string, language: string): Promise<UserLanguage>;
  removeUserLanguage(userId: string, language: string): Promise<boolean>;
  
  // Authentication
  authenticateUser(username: string, password: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Properties - with simplified interface for compatibility
  getProperty(id: string): Promise<PropertyWithDetails | undefined>;
  getPropertyBySlug(slug: string): Promise<PropertyWithDetails | undefined>;
  getProperties(filters?: PropertyFilters): Promise<PropertyWithDetails[]>;
  getFeaturedProperties(): Promise<PropertyWithDetails[]>;
  createProperty(property: InsertProperty, images?: string[], amenities?: string[], features?: string[], userId?: string): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>, images?: string[], amenities?: string[], features?: string[]): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;
  incrementPropertyViews(id: string): Promise<void>;
  isSlugTaken(slug: string, excludePropertyId?: string): Promise<boolean>;
  clearAllProperties(): Promise<void>;

  // Property Images
  getPropertyImages(propertyId: string): Promise<PropertyImage[]>;
  addPropertyImage(image: InsertPropertyImage): Promise<PropertyImage>;
  removePropertyImage(propertyId: string, imageUrl: string): Promise<boolean>;
  removePropertyImageWithResequencing(propertyId: string, imageUrl: string): Promise<{ success: boolean; remainingCount: number }>;
  updatePropertyImageOrder(propertyId: string, imageUpdates: { imageUrl: string; sortOrder: number }[]): Promise<void>;

  // Property Amenities
  getPropertyAmenities(propertyId: string): Promise<PropertyAmenity[]>;
  addPropertyAmenity(amenity: InsertPropertyAmenity): Promise<PropertyAmenity>;
  removePropertyAmenity(propertyId: string, amenity: string): Promise<boolean>;
  replacePropertyAmenities(propertyId: string, amenities: string[]): Promise<void>;

  // Property Features
  getPropertyFeatures(propertyId: string): Promise<PropertyFeature[]>;
  addPropertyFeature(feature: InsertPropertyFeature): Promise<PropertyFeature>;
  removePropertyFeature(propertyId: string, feature: string): Promise<boolean>;
  replacePropertyFeatures(propertyId: string, features: string[]): Promise<void>;

  // Inquiries
  getInquiry(id: string): Promise<Inquiry | undefined>;
  getInquiriesForProperty(propertyId: string): Promise<Inquiry[]>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined>;

  // Favorites
  getFavoritesByUser(userId: string): Promise<PropertyWithDetails[]>;
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(userId: string, propertyId: string): Promise<boolean>;
  isFavorite(userId: string, propertyId: string): Promise<boolean>;

  // Search History
  addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;
  getSearchHistoryByUser(userId: string): Promise<SearchHistory[]>;
  addSearchFilter(filter: InsertSearchFilter): Promise<SearchFilter>;

  // Customer Analytics
  addCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity>;
  getCustomerActivities(userId: string, limit?: number): Promise<CustomerActivity[]>;
  getCustomerPoints(userId: string): Promise<CustomerPoints | undefined>;
  updateCustomerPoints(userId: string, points: Partial<InsertCustomerPoints>): Promise<CustomerPoints>;
  getCustomerAnalytics(userId: string): Promise<{
    totalActivities: number;
    activitiesByType: { activityType: string; count: number; points: number }[];
    pointsHistory: { date: string; points: number }[];
    monthlyActivity: { month: string; activities: number }[];
  }>;

  // Wave management
  getWaves(): Promise<Wave[]>;
  getWave(id: string): Promise<Wave | undefined>;
  createWave(wave: InsertWave): Promise<Wave>;
  updateWave(id: string, wave: Partial<InsertWave>): Promise<Wave | undefined>;
  deleteWave(id: string): Promise<boolean>;
  getPropertiesByWave(waveId: string): Promise<Property[]>;

  // Customer Wave Permissions  
  getCustomerWavePermissions(userId: string): Promise<CustomerWavePermission[]>;
  grantWavePermission(permission: InsertCustomerWavePermission): Promise<CustomerWavePermission>;
  revokeWavePermission(userId: string, waveId: string): Promise<boolean>;
  getWavePermission(userId: string, waveId: string): Promise<CustomerWavePermission | undefined>;
  updateWavePermission(id: string, permission: Partial<InsertCustomerWavePermission>): Promise<CustomerWavePermission | undefined>;
  getUserWaveUsage(userId: string): Promise<{ waveId: string; used: number; max: number }[]>;
  getUserRemainingWaves(userId: string): Promise<number>;
  updateUsersWithZeroWaveBalance(): Promise<void>;
  checkWavePermission(userId: string, waveId: string | null | undefined): Promise<{ allowed: boolean; reason?: string }>;
  incrementWaveUsage(userId: string, waveId: string | null | undefined): Promise<void>;
  decrementWaveUsage(userId: string, waveId: string | null | undefined): Promise<void>;

  // Currency Rates
  getCurrencyRates(): Promise<CurrencyRate[]>;
  getActiveCurrencyRates(): Promise<CurrencyRate[]>;
  getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<CurrencyRate | undefined>;
  createCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate>;
  updateCurrencyRate(id: string, rate: UpdateCurrencyRate): Promise<CurrencyRate | undefined>;
  deactivateCurrencyRate(id: string): Promise<boolean>;
  convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;

  // Client Locations
  createClientLocation(location: InsertClientLocation): Promise<ClientLocation>;
  addClientLocation(location: InsertClientLocation): Promise<ClientLocation>;
  getClientLocations(filters?: any, limit?: number): Promise<ClientLocation[]>;
  countClientLocations(filters?: any): Promise<number>;
  getClientLocationStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  private get dbConn() { 
    return db(); 
  }

  // Helper method to get property with all related data
  private async getPropertyWithDetails(propertyId: string): Promise<PropertyWithDetails | undefined> {
    const [property] = await this.dbConn
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.agentId, users.id))
      .leftJoin(waves, eq(properties.waveId, waves.id))
      .where(eq(properties.id, propertyId));

    if (!property.properties) return undefined;

    const [images, amenities, features, inquiriesData, favoritesData] = await Promise.all([
      this.getPropertyImages(propertyId),
      this.getPropertyAmenities(propertyId),
      this.getPropertyFeatures(propertyId),
      this.getInquiriesForProperty(propertyId),
      this.dbConn.select().from(favorites).where(eq(favorites.propertyId, propertyId))
    ]);

    const sanitizedProperty = {
      ...property.properties,
      agent: property.users ? sanitizeUser(property.users) : null,
      wave: property.waves,
      images,
      amenities,
      features,
      inquiries: inquiriesData,
      favorites: favoritesData
    };
    
    // Return with type assertion to maintain interface compatibility
    return sanitizedProperty as PropertyWithDetails;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.dbConn.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.dbConn.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.dbConn.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = crypto.randomUUID();
    
    // Hash password before storing if it's not already hashed
    let hashedPassword = user.password;
    if (user.password && !user.password.startsWith('$2')) {
      const { hashPassword } = await import("./auth");
      hashedPassword = await hashPassword(user.password);
    }
    
    await this.dbConn.insert(users).values({ ...user, id, password: hashedPassword });
    
    // Add default languages if not specified
    if (!user.role || user.role === 'user') {
      await this.addUserLanguage(id, 'en');
    }
    
    return await this.getUser(id) as User;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    // Hash password if it's being updated and not already hashed
    let updatedUser = { ...user };
    if (user.password && !user.password.startsWith('$2')) {
      const { hashPassword } = await import("./auth");
      updatedUser.password = await hashPassword(user.password);
    }
    
    await this.dbConn.update(users).set(updatedUser).where(eq(users.id, id));
    return await this.getUser(id);
  }

  async getUserLanguages(userId: string): Promise<UserLanguage[]> {
    return await this.dbConn.select().from(userLanguages).where(eq(userLanguages.userId, userId));
  }

  async addUserLanguage(userId: string, language: string): Promise<UserLanguage> {
    await this.dbConn.insert(userLanguages).values({ userId, language });
    const [userLanguage] = await this.dbConn
      .select()
      .from(userLanguages)
      .where(and(eq(userLanguages.userId, userId), eq(userLanguages.language, language)));
    return userLanguage;
  }

  async removeUserLanguage(userId: string, language: string): Promise<boolean> {
    const result = await this.dbConn
      .delete(userLanguages)
      .where(and(eq(userLanguages.userId, userId), eq(userLanguages.language, language)));
    return true; // MySQL doesn't return affectedRows in the same way
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    // Handle backward compatibility for existing plaintext passwords
    const { comparePassword, hashPassword } = await import("./auth");
    
    // If password is already hashed (starts with $2), use bcrypt comparison
    if (user.password.startsWith('$2')) {
      const isValidPassword = await comparePassword(password, user.password);
      return isValidPassword ? user : null;
    } else {
      // Legacy plaintext comparison - rehash and update if successful
      if (user.password === password) {
        // Upgrade to hashed password
        const hashedPassword = await hashPassword(password);
        await this.updateUser(user.id, { password: hashedPassword });
        return user;
      }
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await this.dbConn.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.dbConn.delete(users).where(eq(users.id, id));
    return true;
  }

  // Properties
  async getProperty(id: string): Promise<PropertyWithDetails | undefined> {
    return await this.getPropertyWithDetails(id);
  }

  async getPropertyBySlug(slug: string): Promise<PropertyWithDetails | undefined> {
    const [property] = await this.dbConn.select().from(properties).where(eq(properties.slug, slug));
    if (!property) return undefined;
    return await this.getPropertyWithDetails(property.id);
  }

  async getProperties(filters: PropertyFilters = {}): Promise<PropertyWithDetails[]> {
    // Build the base query
    const baseQuery = this.dbConn
      .select()
      .from(properties)
      .leftJoin(users, eq(properties.agentId, users.id))
      .leftJoin(waves, eq(properties.waveId, waves.id));

    // Apply filters
    const conditions: any[] = [];

    if (filters.type) {
      conditions.push(eq(properties.type, filters.type));
    }
    if (filters.listingType) {
      conditions.push(eq(properties.listingType, filters.listingType));
    }
    if (filters.city) {
      conditions.push(like(properties.city, `%${filters.city}%`));
    }
    if (filters.country) {
      conditions.push(eq(properties.country, filters.country));
    }
    if (filters.language) {
      conditions.push(eq(properties.language, filters.language));
    }
    if (filters.minPrice) {
      conditions.push(gte(properties.price, filters.minPrice.toString()));
    }
    if (filters.maxPrice) {
      conditions.push(lte(properties.price, filters.maxPrice.toString()));
    }
    if (filters.bedrooms) {
      conditions.push(eq(properties.bedrooms, filters.bedrooms));
    }
    if (filters.bathrooms) {
      conditions.push(eq(properties.bathrooms, filters.bathrooms));
    }
    if (filters.search) {
      conditions.push(
        sql`(${properties.title} LIKE ${`%${filters.search}%`} OR ${properties.description} LIKE ${`%${filters.search}%`})`
      );
    }

    // Build query with conditions
    let query: any = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

    // Apply sorting
    if (filters.sortBy === 'price') {
      query = query.orderBy(filters.sortOrder === 'desc' ? desc(properties.price) : asc(properties.price));
    } else if (filters.sortBy === 'date') {
      query = query.orderBy(filters.sortOrder === 'asc' ? asc(properties.createdAt) : desc(properties.createdAt));
    } else if (filters.sortBy === 'views') {
      query = query.orderBy(filters.sortOrder === 'asc' ? asc(properties.views) : desc(properties.views));
    } else {
      query = query.orderBy(desc(properties.createdAt));
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    if (results.length === 0) {
      return [];
    }

    // Extract property IDs for batch queries
    const propertyIds = results
      .filter((result: any) => result.properties)
      .map((result: any) => result.properties.id);

    if (propertyIds.length === 0) {
      return [];
    }

    // Batch fetch all related data at once to avoid N+1 query problem
    const [allImages, allAmenities, allFeatures, allInquiries, allFavorites] = await Promise.all([
      // Get all images for all properties in one query
      this.dbConn
        .select()
        .from(propertyImages)
        .where(inArray(propertyImages.propertyId, propertyIds))
        .orderBy(asc(propertyImages.sortOrder)),
      // Get all amenities for all properties in one query
      this.dbConn
        .select()
        .from(propertyAmenities)
        .where(inArray(propertyAmenities.propertyId, propertyIds)),
      // Get all features for all properties in one query
      this.dbConn
        .select()
        .from(propertyFeatures)
        .where(inArray(propertyFeatures.propertyId, propertyIds)),
      // Get all inquiries for all properties in one query
      this.dbConn
        .select()
        .from(inquiries)
        .where(inArray(inquiries.propertyId, propertyIds)),
      // Get all favorites for all properties in one query
      this.dbConn
        .select()
        .from(favorites)
        .where(inArray(favorites.propertyId, propertyIds))
    ]);

    // Group related data by property ID for efficient lookup
    const imagesByProperty = new Map<string, PropertyImage[]>();
    const amenitiesByProperty = new Map<string, PropertyAmenity[]>();
    const featuresByProperty = new Map<string, PropertyFeature[]>();
    const inquiriesByProperty = new Map<string, Inquiry[]>();
    const favoritesByProperty = new Map<string, Favorite[]>();

    // Group images by property ID
    allImages.forEach(image => {
      if (!imagesByProperty.has(image.propertyId)) {
        imagesByProperty.set(image.propertyId, []);
      }
      imagesByProperty.get(image.propertyId)!.push(image);
    });

    // Group amenities by property ID
    allAmenities.forEach(amenity => {
      if (!amenitiesByProperty.has(amenity.propertyId)) {
        amenitiesByProperty.set(amenity.propertyId, []);
      }
      amenitiesByProperty.get(amenity.propertyId)!.push(amenity);
    });

    // Group features by property ID
    allFeatures.forEach(feature => {
      if (!featuresByProperty.has(feature.propertyId)) {
        featuresByProperty.set(feature.propertyId, []);
      }
      featuresByProperty.get(feature.propertyId)!.push(feature);
    });

    // Group inquiries by property ID
    allInquiries.forEach(inquiry => {
      if (inquiry.propertyId) {
        if (!inquiriesByProperty.has(inquiry.propertyId)) {
          inquiriesByProperty.set(inquiry.propertyId, []);
        }
        inquiriesByProperty.get(inquiry.propertyId)!.push(inquiry);
      }
    });

    // Group favorites by property ID
    allFavorites.forEach(favorite => {
      if (favorite.propertyId) {
        if (!favoritesByProperty.has(favorite.propertyId)) {
          favoritesByProperty.set(favorite.propertyId, []);
        }
        favoritesByProperty.get(favorite.propertyId)!.push(favorite);
      }
    });

    // Build the final result with efficient lookup
    const propertiesWithDetails = results
      .filter((result: any) => result.properties)
      .map((result: any) => {
        const propertyId = result.properties.id;
        
        return {
          ...result.properties,
          agent: result.users,
          wave: result.waves,
          images: imagesByProperty.get(propertyId) || [],
          amenities: amenitiesByProperty.get(propertyId) || [],
          features: featuresByProperty.get(propertyId) || [],
          inquiries: inquiriesByProperty.get(propertyId) || [],
          favorites: favoritesByProperty.get(propertyId) || []
        };
      });

    return propertiesWithDetails as PropertyWithDetails[];
  }

  async getFeaturedProperties(): Promise<PropertyWithDetails[]> {
    return await this.getProperties({ limit: 10 });
  }

  async createProperty(
    property: InsertProperty, 
    images: string[] = [], 
    amenities: string[] = [], 
    features: string[] = [],
    userId?: string
  ): Promise<Property> {
    const id = crypto.randomUUID();
    const slug = property.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Validate and fix waveId if invalid
    let validatedWaveId = property.waveId;
    if (validatedWaveId && validatedWaveId !== 'no-wave') {
      const validWaves = await this.dbConn.select({ id: waves.id }).from(waves);
      const validWaveIds = validWaves.map(w => w.id);
      
      if (validatedWaveId === 'premium-wave') {
        // Map premium-wave to the first available wave or default wave
        validatedWaveId = validWaveIds.find(id => id.includes('default')) || validWaveIds[0] || null;
      } else if (!validWaveIds.includes(validatedWaveId)) {
        // If invalid wave ID, set to null
        validatedWaveId = null;
      }
    } else if (validatedWaveId === 'no-wave') {
      validatedWaveId = null;
    }

    // Determine which user to check wave permissions for (agent or session user)
    const waveCheckUserId = property.agentId || userId;
    
    // Check wave permissions if property has a wave and we have a user to check
    if (waveCheckUserId && validatedWaveId) {
      const permissionCheck = await this.checkWavePermission(waveCheckUserId, validatedWaveId);
      if (!permissionCheck.allowed) {
        throw new Error(permissionCheck.reason || 'Wave permission denied');
      }
    }

    await this.dbConn.insert(properties).values({ ...property, id, slug, waveId: validatedWaveId });

    // Increment wave usage if property was successfully created with a wave
    if (waveCheckUserId && validatedWaveId) {
      await this.incrementWaveUsage(waveCheckUserId, validatedWaveId);
    }

    // Add images, amenities, and features
    if (images.length > 0) {
      await Promise.all(
        images.map((imageUrl, index) =>
          this.addPropertyImage({ propertyId: id, imageUrl, sortOrder: index })
        )
      );
    }

    if (amenities.length > 0) {
      await this.replacePropertyAmenities(id, amenities);
    }

    if (features.length > 0) {
      await this.replacePropertyFeatures(id, features);
    }

    return await this.dbConn.select().from(properties).where(eq(properties.id, id)).then(rows => rows[0]);
  }

  async updateProperty(
    id: string, 
    property: Partial<InsertProperty>, 
    images?: string[], 
    amenities?: string[], 
    features?: string[]
  ): Promise<Property | undefined> {
    await this.dbConn.update(properties).set(property).where(eq(properties.id, id));

    // Update images if provided
    if (images !== undefined) {
      // Remove all existing images
      await this.dbConn.delete(propertyImages).where(eq(propertyImages.propertyId, id));
      // Add new images
      if (images.length > 0) {
        await Promise.all(
          images.map((imageUrl, index) =>
            this.addPropertyImage({ propertyId: id, imageUrl, sortOrder: index })
          )
        );
      }
    }

    // Update amenities if provided
    if (amenities !== undefined) {
      await this.replacePropertyAmenities(id, amenities);
    }

    // Update features if provided
    if (features !== undefined) {
      await this.replacePropertyFeatures(id, features);
    }

    const [updatedProperty] = await this.dbConn.select().from(properties).where(eq(properties.id, id));
    return updatedProperty;
  }

  async deleteProperty(id: string): Promise<boolean> {
    try {
      // Get property details before deletion for wave usage tracking
      const property = await this.getProperty(id);
      
      // Get all property images before deletion for file cleanup
      const propertyImageList = await this.getPropertyImages(id);
      
      // Explicitly delete all related data before deleting the property
      // This ensures proper cleanup even if cascade deletes don't work correctly
      await Promise.all([
        // Delete property images
        this.dbConn.delete(propertyImages).where(eq(propertyImages.propertyId, id)),
        // Delete property amenities
        this.dbConn.delete(propertyAmenities).where(eq(propertyAmenities.propertyId, id)),
        // Delete property features
        this.dbConn.delete(propertyFeatures).where(eq(propertyFeatures.propertyId, id)),
        // Delete favorites for this property
        this.dbConn.delete(favorites).where(eq(favorites.propertyId, id)),
        // Delete inquiries for this property
        this.dbConn.delete(inquiries).where(eq(inquiries.propertyId, id))
      ]);

      // Finally delete the property itself
      await this.dbConn.delete(properties).where(eq(properties.id, id));
      
      // Decrement wave usage if the property had a wave and an agent
      if (property && property.waveId && property.agentId) {
        await this.decrementWaveUsage(property.agentId, property.waveId);
      }
      
      // Clean up image files after successful database deletion
      await Promise.all(
        propertyImageList.map(image => this.cleanupImageFile(image.imageUrl))
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to delete property ${id}:`, error);
      throw error;
    }
  }

  async incrementPropertyViews(id: string): Promise<void> {
    await this.dbConn
      .update(properties)
      .set({ views: sql`${properties.views} + 1` })
      .where(eq(properties.id, id));
  }

  async isSlugTaken(slug: string, excludePropertyId?: string): Promise<boolean> {
    let query: any = this.dbConn.select().from(properties).where(eq(properties.slug, slug));
    
    if (excludePropertyId) {
      query = query.where(and(eq(properties.slug, slug), sql`${properties.id} != ${excludePropertyId}`));
    }
    
    const [existing] = await query;
    return !!existing;
  }

  async clearAllProperties(): Promise<void> {
    await this.dbConn.delete(properties);
  }

  // Property Images
  async getPropertyImages(propertyId: string): Promise<PropertyImage[]> {
    return await this.dbConn
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, propertyId))
      .orderBy(asc(propertyImages.sortOrder));
  }

  async addPropertyImage(image: InsertPropertyImage): Promise<PropertyImage> {
    await this.dbConn.insert(propertyImages).values(image);
    const [createdImage] = await this.dbConn
      .select()
      .from(propertyImages)
      .where(and(eq(propertyImages.propertyId, image.propertyId), eq(propertyImages.imageUrl, image.imageUrl)));
    return createdImage;
  }

  async removePropertyImage(propertyId: string, imageUrl: string): Promise<boolean> {
    await this.dbConn
      .delete(propertyImages)
      .where(and(eq(propertyImages.propertyId, propertyId), eq(propertyImages.imageUrl, imageUrl)));
    return true;
  }

  async removePropertyImageWithResequencing(propertyId: string, imageUrl: string): Promise<{ success: boolean; remainingCount: number }> {
    try {
      // Begin transaction to ensure atomicity
      const result = await this.dbConn.transaction(async (tx) => {
        // First, check if the image exists
        const [existingImage] = await tx
          .select()
          .from(propertyImages)
          .where(and(eq(propertyImages.propertyId, propertyId), eq(propertyImages.imageUrl, imageUrl)));

        if (!existingImage) {
          return { success: false, remainingCount: 0 };
        }

        // Delete the specific image
        await tx
          .delete(propertyImages)
          .where(and(eq(propertyImages.propertyId, propertyId), eq(propertyImages.imageUrl, imageUrl)));

        // Get remaining images ordered by current sort order
        const remainingImages = await tx
          .select()
          .from(propertyImages)
          .where(eq(propertyImages.propertyId, propertyId))
          .orderBy(asc(propertyImages.sortOrder));

        // Resequence remaining images to be sequential (0, 1, 2, ...)
        if (remainingImages.length > 0) {
          await Promise.all(
            remainingImages.map((img, index) =>
              tx
                .update(propertyImages)
                .set({ sortOrder: index })
                .where(eq(propertyImages.id, img.id))
            )
          );
        }

        return { success: true, remainingCount: remainingImages.length };
      });

      // If database operation succeeded, attempt file cleanup
      if (result.success) {
        await this.cleanupImageFile(imageUrl);
      }

      return result;
    } catch (error) {
      console.error(`Failed to remove property image ${imageUrl} for property ${propertyId}:`, error);
      throw error;
    }
  }

  private async cleanupImageFile(imageUrl: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Only clean up files that are in our uploads directory
      if (imageUrl.startsWith('/uploads/properties/')) {
        // Extract filename and build safe absolute path
        const filename = path.basename(imageUrl);
        const uploadsDir = path.join(__dirname, 'uploads', 'properties');
        const filePath = path.join(uploadsDir, filename);
        
        // Ensure the file path is within our uploads directory (prevent path traversal)
        const normalizedPath = path.normalize(filePath);
        const normalizedUploadsDir = path.normalize(uploadsDir);
        
        if (normalizedPath.startsWith(normalizedUploadsDir)) {
          // Check if file exists before attempting deletion
          try {
            await fs.access(filePath);
            await fs.unlink(filePath);
            console.log(`✅ Cleaned up image file: ${filePath}`);
          } catch (fileError: any) {
            // File doesn't exist or can't be deleted - log but don't throw
            if (fileError.code !== 'ENOENT') {
              console.warn(`⚠️ Could not delete image file ${filePath}:`, fileError.message);
            }
          }
        } else {
          console.warn(`⚠️ Attempted to delete file outside uploads directory: ${imageUrl}`);
        }
      } else {
        // External URL (like Unsplash) - no cleanup needed
        console.log(`ℹ️ External image URL, no file cleanup needed: ${imageUrl}`);
      }
    } catch (error) {
      console.warn(`⚠️ File cleanup failed for ${imageUrl}:`, error);
      // Don't throw error - file cleanup failure shouldn't break the API response
    }
  }

  async updatePropertyImageOrder(propertyId: string, imageUpdates: { imageUrl: string; sortOrder: number }[]): Promise<void> {
    await Promise.all(
      imageUpdates.map(({ imageUrl, sortOrder }) =>
        this.dbConn
          .update(propertyImages)
          .set({ sortOrder })
          .where(and(eq(propertyImages.propertyId, propertyId), eq(propertyImages.imageUrl, imageUrl)))
      )
    );
  }

  // Property Amenities
  async getPropertyAmenities(propertyId: string): Promise<PropertyAmenity[]> {
    return await this.dbConn
      .select()
      .from(propertyAmenities)
      .where(eq(propertyAmenities.propertyId, propertyId));
  }

  async addPropertyAmenity(amenity: InsertPropertyAmenity): Promise<PropertyAmenity> {
    await this.dbConn.insert(propertyAmenities).values(amenity);
    const [createdAmenity] = await this.dbConn
      .select()
      .from(propertyAmenities)
      .where(and(eq(propertyAmenities.propertyId, amenity.propertyId), eq(propertyAmenities.amenity, amenity.amenity)));
    return createdAmenity;
  }

  async removePropertyAmenity(propertyId: string, amenity: string): Promise<boolean> {
    await this.dbConn
      .delete(propertyAmenities)
      .where(and(eq(propertyAmenities.propertyId, propertyId), eq(propertyAmenities.amenity, amenity)));
    return true;
  }

  async replacePropertyAmenities(propertyId: string, amenities: string[]): Promise<void> {
    // Remove all existing amenities
    await this.dbConn.delete(propertyAmenities).where(eq(propertyAmenities.propertyId, propertyId));
    
    // Add new amenities
    if (amenities.length > 0) {
      await this.dbConn.insert(propertyAmenities).values(
        amenities.map(amenity => ({ propertyId, amenity }))
      );
    }
  }

  // Property Features
  async getPropertyFeatures(propertyId: string): Promise<PropertyFeature[]> {
    return await this.dbConn
      .select()
      .from(propertyFeatures)
      .where(eq(propertyFeatures.propertyId, propertyId));
  }

  async addPropertyFeature(feature: InsertPropertyFeature): Promise<PropertyFeature> {
    await this.dbConn.insert(propertyFeatures).values(feature);
    const [createdFeature] = await this.dbConn
      .select()
      .from(propertyFeatures)
      .where(and(eq(propertyFeatures.propertyId, feature.propertyId), eq(propertyFeatures.feature, feature.feature)));
    return createdFeature;
  }

  async removePropertyFeature(propertyId: string, feature: string): Promise<boolean> {
    await this.dbConn
      .delete(propertyFeatures)
      .where(and(eq(propertyFeatures.propertyId, propertyId), eq(propertyFeatures.feature, feature)));
    return true;
  }

  async replacePropertyFeatures(propertyId: string, features: string[]): Promise<void> {
    // Remove all existing features
    await this.dbConn.delete(propertyFeatures).where(eq(propertyFeatures.propertyId, propertyId));
    
    // Add new features
    if (features.length > 0) {
      await this.dbConn.insert(propertyFeatures).values(
        features.map(feature => ({ propertyId, feature }))
      );
    }
  }

  // Inquiries
  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await this.dbConn.select().from(inquiries).where(eq(inquiries.id, id));
    return inquiry;
  }

  async getInquiriesForProperty(propertyId: string): Promise<Inquiry[]> {
    return await this.dbConn
      .select()
      .from(inquiries)
      .where(eq(inquiries.propertyId, propertyId))
      .orderBy(desc(inquiries.createdAt));
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(inquiries).values({ ...inquiry, id });
    return await this.getInquiry(id) as Inquiry;
  }

  async updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined> {
    await this.dbConn.update(inquiries).set({ status }).where(eq(inquiries.id, id));
    return await this.getInquiry(id);
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<PropertyWithDetails[]> {
    const userFavorites = await this.dbConn
      .select({ propertyId: favorites.propertyId })
      .from(favorites)
      .where(eq(favorites.userId, userId));

    const propertyIds = userFavorites.map(f => f.propertyId).filter(id => id != null);
    if (propertyIds.length === 0) return [];

    const propertiesWithDetails = await Promise.all(
      propertyIds.map(id => this.getPropertyWithDetails(id))
    );

    return propertiesWithDetails.filter(p => p !== undefined) as PropertyWithDetails[];
  }

  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(favorites).values({ ...favorite, id });
    const [createdFavorite] = await this.dbConn.select().from(favorites).where(eq(favorites.id, id));
    return createdFavorite;
  }

  async removeFromFavorites(userId: string, propertyId: string): Promise<boolean> {
    await this.dbConn
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return true;
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const [favorite] = await this.dbConn
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return !!favorite;
  }

  // Search History
  async addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(searchHistory).values({ ...search, id });
    return await this.dbConn.select().from(searchHistory).where(eq(searchHistory.id, id)).then(rows => rows[0]);
  }

  async getSearchHistoryByUser(userId: string): Promise<SearchHistory[]> {
    return await this.dbConn
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.createdAt));
  }

  async addSearchFilter(filter: InsertSearchFilter): Promise<SearchFilter> {
    await this.dbConn.insert(searchFilters).values(filter);
    const [createdFilter] = await this.dbConn
      .select()
      .from(searchFilters)
      .where(and(eq(searchFilters.searchId, filter.searchId), eq(searchFilters.filterKey, filter.filterKey)));
    return createdFilter;
  }

  // Customer Analytics
  async addCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(customerActivity).values({ ...activity, id });
    return await this.dbConn.select().from(customerActivity).where(eq(customerActivity.id, id)).then(rows => rows[0]);
  }

  async getCustomerActivities(userId: string, limit: number = 50): Promise<CustomerActivity[]> {
    return await this.dbConn
      .select()
      .from(customerActivity)
      .where(eq(customerActivity.userId, userId))
      .orderBy(desc(customerActivity.createdAt))
      .limit(limit);
  }

  async getCustomerPoints(userId: string): Promise<CustomerPoints | undefined> {
    const [points] = await this.dbConn.select().from(customerPoints).where(eq(customerPoints.userId, userId));
    return points;
  }

  async updateCustomerPoints(userId: string, points: Partial<InsertCustomerPoints>): Promise<CustomerPoints> {
    const existing = await this.getCustomerPoints(userId);
    
    if (existing) {
      await this.dbConn.update(customerPoints).set(points).where(eq(customerPoints.userId, userId));
      return await this.getCustomerPoints(userId) as CustomerPoints;
    } else {
      const id = crypto.randomUUID();
      await this.dbConn.insert(customerPoints).values({ ...points, id, userId });
      return await this.getCustomerPoints(userId) as CustomerPoints;
    }
  }

  async getCustomerAnalytics(userId: string): Promise<{
    totalActivities: number;
    activitiesByType: { activityType: string; count: number; points: number }[];
    pointsHistory: { date: string; points: number }[];
    monthlyActivity: { month: string; activities: number }[];
  }> {
    return {
      totalActivities: 0,
      activitiesByType: [],
      pointsHistory: [],
      monthlyActivity: []
    };
  }

  // Wave management
  async getWaves(): Promise<Wave[]> {
    return await this.dbConn.select().from(waves).orderBy(desc(waves.createdAt));
  }

  async getWave(id: string): Promise<Wave | undefined> {
    const [wave] = await this.dbConn.select().from(waves).where(eq(waves.id, id));
    return wave;
  }

  async createWave(wave: InsertWave): Promise<Wave> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(waves).values({ ...wave, id });
    return await this.getWave(id) as Wave;
  }

  async updateWave(id: string, wave: Partial<InsertWave>): Promise<Wave | undefined> {
    await this.dbConn.update(waves).set(wave).where(eq(waves.id, id));
    return await this.getWave(id);
  }

  async deleteWave(id: string): Promise<boolean> {
    await this.dbConn.delete(waves).where(eq(waves.id, id));
    return true;
  }

  async getPropertiesByWave(waveId: string): Promise<Property[]> {
    return await this.dbConn.select().from(properties).where(eq(properties.waveId, waveId));
  }

  // Customer Wave Permissions
  async getCustomerWavePermissions(userId: string): Promise<CustomerWavePermission[]> {
    return await this.dbConn
      .select()
      .from(customerWavePermissions)
      .where(eq(customerWavePermissions.userId, userId));
  }

  async grantWavePermission(permission: InsertCustomerWavePermission): Promise<CustomerWavePermission> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(customerWavePermissions).values({ ...permission, id });
    const [createdPermission] = await this.dbConn
      .select()
      .from(customerWavePermissions)
      .where(eq(customerWavePermissions.id, id));
    return createdPermission;
  }

  async revokeWavePermission(userId: string, waveId: string): Promise<boolean> {
    await this.dbConn
      .delete(customerWavePermissions)
      .where(and(eq(customerWavePermissions.userId, userId), eq(customerWavePermissions.waveId, waveId)));
    return true;
  }

  async getWavePermission(userId: string, waveId: string): Promise<CustomerWavePermission | undefined> {
    const [permission] = await this.dbConn
      .select()
      .from(customerWavePermissions)
      .where(and(eq(customerWavePermissions.userId, userId), eq(customerWavePermissions.waveId, waveId)));
    return permission;
  }

  async updateWavePermission(id: string, permission: Partial<InsertCustomerWavePermission>): Promise<CustomerWavePermission | undefined> {
    await this.dbConn.update(customerWavePermissions).set(permission).where(eq(customerWavePermissions.id, id));
    const [updated] = await this.dbConn.select().from(customerWavePermissions).where(eq(customerWavePermissions.id, id));
    return updated;
  }

  async getUserWaveUsage(userId: string): Promise<{ waveId: string; used: number; max: number }[]> {
    const permissions = await this.getCustomerWavePermissions(userId);
    return permissions.map(p => ({
      waveId: p.waveId,
      used: p.usedProperties || 0,
      max: p.maxProperties
    }));
  }

  async getUserRemainingWaves(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.waveBalance || 0;
  }

  async checkWavePermission(userId: string, waveId: string | null | undefined): Promise<{ allowed: boolean; reason?: string }> {
    // Allow admin and super admin users unlimited access
    const user = await this.getUser(userId);
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return { allowed: true };
    }

    // If no wave specified (waveId is null or 'no-wave'), allow
    if (!waveId || waveId === 'no-wave') {
      return { allowed: true };
    }

    // Check if user has permission for this wave
    const permission = await this.getWavePermission(userId, waveId);
    if (!permission) {
      return { allowed: false, reason: 'User does not have permission to use this wave' };
    }

    // Check if user has exceeded their property limit for this wave
    if ((permission.usedProperties || 0) >= permission.maxProperties) {
      return { allowed: false, reason: `Maximum properties limit reached for this wave (${permission.maxProperties} properties allowed)` };
    }

    return { allowed: true };
  }

  async incrementWaveUsage(userId: string, waveId: string | null | undefined): Promise<void> {
    if (!waveId || waveId === 'no-wave') {
      return; // No tracking needed for non-wave properties
    }

    const permission = await this.getWavePermission(userId, waveId);
    if (permission) {
      await this.updateWavePermission(permission.id, {
        usedProperties: ((permission.usedProperties || 0) + 1)
      });
    }
  }

  async decrementWaveUsage(userId: string, waveId: string | null | undefined): Promise<void> {
    if (!waveId || waveId === 'no-wave') {
      return; // No tracking needed for non-wave properties
    }

    const permission = await this.getWavePermission(userId, waveId);
    if (permission && (permission.usedProperties || 0) > 0) {
      await this.updateWavePermission(permission.id, {
        usedProperties: (permission.usedProperties || 0) - 1
      });
    }
  }

  async updateUsersWithZeroWaveBalance(): Promise<void> {
    await this.dbConn.update(users).set({ waveBalance: 0 }).where(lte(users.waveBalance, 0));
  }

  // Currency Rates
  async getCurrencyRates(): Promise<CurrencyRate[]> {
    return await this.dbConn
      .select()
      .from(currencyRates)
      .where(eq(currencyRates.isActive, true))
      .orderBy(currencyRates.fromCurrency, currencyRates.toCurrency);
  }

  async getActiveCurrencyRates(): Promise<CurrencyRate[]> {
    return await this.getCurrencyRates();
  }

  async getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<CurrencyRate | undefined> {
    const [rate] = await this.dbConn
      .select()
      .from(currencyRates)
      .where(and(
        eq(currencyRates.fromCurrency, fromCurrency),
        eq(currencyRates.toCurrency, toCurrency),
        eq(currencyRates.isActive, true)
      ));
    return rate;
  }

  async createCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(currencyRates).values({ ...rate, id });
    const [createdRate] = await this.dbConn.select().from(currencyRates).where(eq(currencyRates.id, id));
    return createdRate;
  }

  async updateCurrencyRate(id: string, rate: UpdateCurrencyRate): Promise<CurrencyRate | undefined> {
    await this.dbConn.update(currencyRates).set(rate).where(eq(currencyRates.id, id));
    const [updatedRate] = await this.dbConn.select().from(currencyRates).where(eq(currencyRates.id, id));
    return updatedRate;
  }

  async deactivateCurrencyRate(id: string): Promise<boolean> {
    await this.dbConn.update(currencyRates).set({ isActive: false }).where(eq(currencyRates.id, id));
    return true;
  }

  async convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = await this.getCurrencyRate(fromCurrency, toCurrency);
    if (!rate) return amount;
    
    return amount * parseFloat(rate.rate.toString());
  }

  // Client Locations
  async createClientLocation(location: InsertClientLocation): Promise<ClientLocation> {
    return await this.addClientLocation(location);
  }

  async addClientLocation(location: InsertClientLocation): Promise<ClientLocation> {
    const id = crypto.randomUUID();
    await this.dbConn.insert(clientLocations).values({ ...location, id });
    const [createdLocation] = await this.dbConn.select().from(clientLocations).where(eq(clientLocations.id, id));
    return createdLocation;
  }

  async getClientLocations(filters: any = {}, limit: number = 100): Promise<ClientLocation[]> {
    return await this.dbConn
      .select()
      .from(clientLocations)
      .orderBy(desc(clientLocations.createdAt))
      .limit(limit);
  }

  async countClientLocations(filters: any = {}): Promise<number> {
    const [result] = await this.dbConn
      .select({ count: sql<number>`count(*)` })
      .from(clientLocations);
    return result?.count || 0;
  }

  async getClientLocationStats(): Promise<any> {
    return {
      total: await this.countClientLocations(),
      byCountry: [],
      byCity: []
    };
  }
}

// Export the storage instance (will be initialized by StorageFactory)
export let storage: IStorage;