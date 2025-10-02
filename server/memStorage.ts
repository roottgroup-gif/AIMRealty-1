import { 
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
import { IStorage } from "./storage";
import { generatePropertySlug, generateUniqueSlug } from "@shared/slug-utils";

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private userLanguages: Map<string, UserLanguage[]> = new Map();
  private properties: Map<string, Property> = new Map();
  private propertyImages: Map<string, PropertyImage[]> = new Map();
  private propertyAmenities: Map<string, PropertyAmenity[]> = new Map();
  private propertyFeatures: Map<string, PropertyFeature[]> = new Map();
  private inquiries: Map<string, Inquiry> = new Map();
  private favorites: Map<string, Favorite[]> = new Map();
  private searchHistory: Map<string, SearchHistory[]> = new Map();
  private searchFilters: Map<string, SearchFilter[]> = new Map();
  private customerActivity: Map<string, CustomerActivity[]> = new Map();
  private activityMetadata: Map<string, ActivityMetadata[]> = new Map();
  private customerPoints: Map<string, CustomerPoints[]> = new Map();
  private waves: Map<string, Wave> = new Map();
  private customerWavePermissions: Map<string, CustomerWavePermission[]> = new Map();
  private currencyRates: Map<string, CurrencyRate> = new Map();
  private clientLocations: Map<string, ClientLocation> = new Map();

  private defaultUsersInitialized = false;

  constructor() {
    // Initialize default users only in development mode
    if (process.env.NODE_ENV === 'development') {
      this.initializeDefaultUsers();
    }
  }

  private async initializeDefaultUsers(): Promise<void> {
    if (this.defaultUsersInitialized) return;
    
    try {
      const { hashPassword } = await import("./auth");
      
      // Generate secure random password for admin
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const agentPassword = process.env.AGENT_PASSWORD || "agent123";
      
      // Create default admin user
      const adminId = this.generateId();
      const hashedAdminPassword = await hashPassword(adminPassword);
      
      const adminUser: User = {
        id: adminId,
        username: "admin",
        email: "admin@estateai.com",
        password: hashedAdminPassword,
        role: "super_admin",
        firstName: "System",
        lastName: "Admin",
        phone: "+964 750 000 0000",
        isVerified: true,
        createdAt: new Date()
      };
      
      this.users.set(adminId, adminUser);
      
      // Create default agent user
      const agentId = this.generateId();
      const hashedAgentPassword = await hashPassword(agentPassword);
      
      const agentUser: User = {
        id: agentId,
        username: "john_agent",
        email: "john@estateai.com",
        password: hashedAgentPassword,
        role: "agent",
        firstName: "John",
        lastName: "Smith",
        phone: "+964 750 123 4567",
        isVerified: true,
        createdAt: new Date()
      };
      
      this.users.set(agentId, agentUser);
      
      this.defaultUsersInitialized = true;
      console.log("✅ Default users initialized in MemStorage (development mode)");
      console.log("🔑 Use 'admin' and 'john_agent' usernames to login");
      
    } catch (error) {
      console.error("❌ Error initializing default users:", error);
    }
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    await this.initializeDefaultUsers(); // Ensure initialization is complete
    
    const id = this.generateId();
    
    // Hash password before storing if it's not already hashed
    let hashedPassword = user.password;
    if (user.password && !user.password.startsWith('$2')) {
      const { hashPassword } = await import("./auth");
      hashedPassword = await hashPassword(user.password);
    }
    
    const newUser: User = {
      id,
      ...user,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    
    // Hash password if it's being updated and not already hashed
    let updatedUser = { ...user };
    if (user.password && !user.password.startsWith('$2')) {
      const { hashPassword } = await import("./auth");
      updatedUser.password = await hashPassword(user.password);
    }
    
    const updated = { ...existing, ...updatedUser };
    this.users.set(id, updated);
    return updated;
  }

  async getUserLanguages(userId: string): Promise<UserLanguage[]> {
    return this.userLanguages.get(userId) || [];
  }

  async addUserLanguage(userId: string, language: string): Promise<UserLanguage> {
    const userLangs = this.userLanguages.get(userId) || [];
    const newLang: UserLanguage = {
      id: userLangs.length + 1,
      userId,
      language,
      createdAt: new Date(),
    };
    userLangs.push(newLang);
    this.userLanguages.set(userId, userLangs);
    return newLang;
  }

  async removeUserLanguage(userId: string, language: string): Promise<boolean> {
    const userLangs = this.userLanguages.get(userId) || [];
    const filtered = userLangs.filter(lang => lang.language !== language);
    this.userLanguages.set(userId, filtered);
    return filtered.length < userLangs.length;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    await this.initializeDefaultUsers(); // Ensure initialization is complete
    
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
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Properties
  async getProperty(id: string): Promise<PropertyWithDetails | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    
    return {
      ...property,
      agent: property.agentId ? await this.getUser(property.agentId) : undefined,
      wave: property.waveId ? await this.getWave(property.waveId) : undefined,
      images: await this.getPropertyImages(id),
      amenities: await this.getPropertyAmenities(id),
      features: await this.getPropertyFeatures(id),
      inquiries: await this.getInquiriesForProperty(id),
      favorites: this.favorites.get(id) || []
    };
  }

  async getPropertyBySlug(slug: string): Promise<PropertyWithDetails | undefined> {
    for (const property of this.properties.values()) {
      if (property.slug === slug) {
        return this.getProperty(property.id);
      }
    }
    return undefined;
  }

  async getProperties(filters?: PropertyFilters): Promise<PropertyWithDetails[]> {
    const properties: PropertyWithDetails[] = [];
    for (const property of this.properties.values()) {
      const detailed = await this.getProperty(property.id);
      if (detailed) properties.push(detailed);
    }
    return properties;
  }

  async getFeaturedProperties(): Promise<PropertyWithDetails[]> {
    return this.getProperties();
  }

  async createProperty(property: InsertProperty, images?: string[], amenities?: string[], features?: string[]): Promise<Property> {
    const id = this.generateId();
    const slug = await generateUniqueSlug(property.title, (slug) => this.isSlugTaken(slug));
    
    const newProperty: Property = {
      id,
      slug,
      ...property,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.properties.set(id, newProperty);
    
    if (images) {
      for (let i = 0; i < images.length; i++) {
        await this.addPropertyImage({ propertyId: id, imageUrl: images[i], sortOrder: i });
      }
    }
    
    if (amenities) {
      await this.replacePropertyAmenities(id, amenities);
    }
    
    if (features) {
      await this.replacePropertyFeatures(id, features);
    }
    
    return newProperty;
  }

  async updateProperty(id: string, property: Partial<InsertProperty>, images?: string[], amenities?: string[], features?: string[]): Promise<Property | undefined> {
    const existing = this.properties.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...property,
      updatedAt: new Date()
    };
    
    this.properties.set(id, updated);
    
    if (images) {
      this.propertyImages.set(id, []);
      for (let i = 0; i < images.length; i++) {
        await this.addPropertyImage({ propertyId: id, imageUrl: images[i], sortOrder: i });
      }
    }
    
    if (amenities) {
      await this.replacePropertyAmenities(id, amenities);
    }
    
    if (features) {
      await this.replacePropertyFeatures(id, features);
    }
    
    return updated;
  }

  async deleteProperty(id: string): Promise<boolean> {
    this.propertyImages.delete(id);
    this.propertyAmenities.delete(id);
    this.propertyFeatures.delete(id);
    this.favorites.delete(id);
    return this.properties.delete(id);
  }

  async incrementPropertyViews(id: string): Promise<void> {
    const property = this.properties.get(id);
    if (property) {
      property.views = (property.views || 0) + 1;
    }
  }

  async isSlugTaken(slug: string, excludePropertyId?: string): Promise<boolean> {
    for (const property of this.properties.values()) {
      if (property.slug === slug && property.id !== excludePropertyId) {
        return true;
      }
    }
    return false;
  }

  async clearAllProperties(): Promise<void> {
    this.properties.clear();
    this.propertyImages.clear();
    this.propertyAmenities.clear();
    this.propertyFeatures.clear();
  }

  // Property Images
  async getPropertyImages(propertyId: string): Promise<PropertyImage[]> {
    return this.propertyImages.get(propertyId) || [];
  }

  async getAllPropertyImages(): Promise<Array<PropertyImage & { propertyTitle?: string | null }>> {
    const allImages: Array<PropertyImage & { propertyTitle?: string | null }> = [];
    for (const [propertyId, images] of this.propertyImages.entries()) {
      const property = this.properties.get(propertyId);
      images.forEach(img => {
        allImages.push({
          ...img,
          propertyTitle: property?.title || null
        });
      });
    }
    return allImages;
  }

  async addPropertyImage(image: InsertPropertyImage): Promise<PropertyImage> {
    const images = this.propertyImages.get(image.propertyId) || [];
    const newImage: PropertyImage = {
      id: images.length + 1,
      ...image,
      createdAt: new Date(),
    };
    images.push(newImage);
    this.propertyImages.set(image.propertyId, images);
    return newImage;
  }

  async removePropertyImage(propertyId: string, imageUrl: string): Promise<boolean> {
    const images = this.propertyImages.get(propertyId) || [];
    const filtered = images.filter(img => img.imageUrl !== imageUrl);
    this.propertyImages.set(propertyId, filtered);
    return filtered.length < images.length;
  }

  async removePropertyImageWithResequencing(propertyId: string, imageUrl: string): Promise<{ success: boolean; remainingCount: number }> {
    const images = this.propertyImages.get(propertyId) || [];
    const initialCount = images.length;
    
    // Filter out the specific image
    const filtered = images.filter(img => img.imageUrl !== imageUrl);
    
    if (filtered.length === initialCount) {
      // Image was not found
      return { success: false, remainingCount: initialCount };
    }
    
    // Resequence the remaining images
    filtered.forEach((img, index) => {
      img.sortOrder = index;
    });
    
    this.propertyImages.set(propertyId, filtered);
    
    return { success: true, remainingCount: filtered.length };
  }

  async updatePropertyImageOrder(propertyId: string, imageUpdates: { imageUrl: string; sortOrder: number }[]): Promise<void> {
    const images = this.propertyImages.get(propertyId) || [];
    for (const update of imageUpdates) {
      const image = images.find(img => img.imageUrl === update.imageUrl);
      if (image) {
        image.sortOrder = update.sortOrder;
      }
    }
  }

  // Property Amenities
  async getPropertyAmenities(propertyId: string): Promise<PropertyAmenity[]> {
    return this.propertyAmenities.get(propertyId) || [];
  }

  async addPropertyAmenity(amenity: InsertPropertyAmenity): Promise<PropertyAmenity> {
    const amenities = this.propertyAmenities.get(amenity.propertyId) || [];
    const newAmenity: PropertyAmenity = {
      id: amenities.length + 1,
      ...amenity,
      createdAt: new Date(),
    };
    amenities.push(newAmenity);
    this.propertyAmenities.set(amenity.propertyId, amenities);
    return newAmenity;
  }

  async removePropertyAmenity(propertyId: string, amenity: string): Promise<boolean> {
    const amenities = this.propertyAmenities.get(propertyId) || [];
    const filtered = amenities.filter(a => a.amenity !== amenity);
    this.propertyAmenities.set(propertyId, filtered);
    return filtered.length < amenities.length;
  }

  async replacePropertyAmenities(propertyId: string, amenities: string[]): Promise<void> {
    this.propertyAmenities.set(propertyId, []);
    for (const amenity of amenities) {
      await this.addPropertyAmenity({ propertyId, amenity });
    }
  }

  // Property Features
  async getPropertyFeatures(propertyId: string): Promise<PropertyFeature[]> {
    return this.propertyFeatures.get(propertyId) || [];
  }

  async addPropertyFeature(feature: InsertPropertyFeature): Promise<PropertyFeature> {
    const features = this.propertyFeatures.get(feature.propertyId) || [];
    const newFeature: PropertyFeature = {
      id: features.length + 1,
      ...feature,
      createdAt: new Date(),
    };
    features.push(newFeature);
    this.propertyFeatures.set(feature.propertyId, features);
    return newFeature;
  }

  async removePropertyFeature(propertyId: string, feature: string): Promise<boolean> {
    const features = this.propertyFeatures.get(propertyId) || [];
    const filtered = features.filter(f => f.feature !== feature);
    this.propertyFeatures.set(propertyId, filtered);
    return filtered.length < features.length;
  }

  async replacePropertyFeatures(propertyId: string, features: string[]): Promise<void> {
    this.propertyFeatures.set(propertyId, []);
    for (const feature of features) {
      await this.addPropertyFeature({ propertyId, feature });
    }
  }

  // Language permissions
  async grantAllLanguagePermissionsToUser(userId: string): Promise<void> {
    const languages = ['en', 'ar', 'tr', 'ku'];
    for (const lang of languages) {
      await this.addUserLanguage(userId, lang);
    }
  }

  async fixExistingUsersLanguagePermissions(): Promise<void> {
    for (const user of this.users.values()) {
      if (user.role === 'user') {
        await this.grantAllLanguagePermissionsToUser(user.id);
      }
    }
  }

  // Inquiries
  async getInquiry(id: string): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async getInquiriesForProperty(propertyId: string): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values()).filter(i => i.propertyId === propertyId);
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const id = this.generateId();
    const newInquiry: Inquiry = { id, ...inquiry, createdAt: new Date() };
    this.inquiries.set(id, newInquiry);
    return newInquiry;
  }

  async updateInquiryStatus(id: string, status: string): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return undefined;
    const updated = { ...inquiry, status };
    this.inquiries.set(id, updated);
    return updated;
  }

  // Favorites
  async getFavoritesByUser(userId: string): Promise<PropertyWithDetails[]> {
    const userFavorites = this.favorites.get(userId) || [];
    const properties: PropertyWithDetails[] = [];
    for (const fav of userFavorites) {
      const property = await this.getProperty(fav.propertyId);
      if (property) properties.push(property);
    }
    return properties;
  }

  async addToFavorites(favorite: InsertFavorite): Promise<Favorite> {
    const userFavs = this.favorites.get(favorite.userId) || [];
    const newFavorite: Favorite = {
      id: userFavs.length + 1,
      ...favorite,
      createdAt: new Date(),
    };
    userFavs.push(newFavorite);
    this.favorites.set(favorite.userId, userFavs);
    return newFavorite;
  }

  async removeFromFavorites(userId: string, propertyId: string): Promise<boolean> {
    const userFavs = this.favorites.get(userId) || [];
    const filtered = userFavs.filter(f => f.propertyId !== propertyId);
    this.favorites.set(userId, filtered);
    return filtered.length < userFavs.length;
  }

  async isFavorite(userId: string, propertyId: string): Promise<boolean> {
    const userFavs = this.favorites.get(userId) || [];
    return userFavs.some(f => f.propertyId === propertyId);
  }

  // Search History
  async addSearchHistory(search: InsertSearchHistory): Promise<SearchHistory> {
    const userHistory = this.searchHistory.get(search.userId) || [];
    const newSearch: SearchHistory = {
      id: this.generateId(),
      ...search,
      createdAt: new Date(),
    };
    userHistory.push(newSearch);
    this.searchHistory.set(search.userId, userHistory);
    return newSearch;
  }

  async getSearchHistoryByUser(userId: string): Promise<SearchHistory[]> {
    return this.searchHistory.get(userId) || [];
  }

  async addSearchFilter(filter: InsertSearchFilter): Promise<SearchFilter> {
    const userFilters = this.searchFilters.get(filter.userId) || [];
    const newFilter: SearchFilter = {
      id: this.generateId(),
      ...filter,
      createdAt: new Date(),
    };
    userFilters.push(newFilter);
    this.searchFilters.set(filter.userId, userFilters);
    return newFilter;
  }

  // Customer Analytics
  async addCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    const userActivities = this.customerActivity.get(activity.userId) || [];
    const newActivity: CustomerActivity = {
      id: this.generateId(),
      ...activity,
      createdAt: new Date(),
    };
    userActivities.push(newActivity);
    this.customerActivity.set(activity.userId, userActivities);
    return newActivity;
  }

  async getCustomerActivities(userId: string, limit?: number): Promise<CustomerActivity[]> {
    const activities = this.customerActivity.get(userId) || [];
    return limit ? activities.slice(0, limit) : activities;
  }

  async getCustomerPoints(userId: string): Promise<CustomerPoints | undefined> {
    const points = this.customerPoints.get(userId) || [];
    return points[points.length - 1];
  }

  async updateCustomerPoints(userId: string, points: Partial<InsertCustomerPoints>): Promise<CustomerPoints> {
    const existing = await this.getCustomerPoints(userId);
    const updated: CustomerPoints = {
      id: existing?.id || this.generateId(),
      userId,
      totalPoints: points.totalPoints ?? existing?.totalPoints ?? 0,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    const userPoints = this.customerPoints.get(userId) || [];
    if (existing) {
      const index = userPoints.findIndex(p => p.id === existing.id);
      if (index >= 0) userPoints[index] = updated;
    } else {
      userPoints.push(updated);
    }
    this.customerPoints.set(userId, userPoints);
    return updated;
  }

  async getCustomerAnalytics(userId: string): Promise<{
    totalActivities: number;
    activitiesByType: { activityType: string; count: number; points: number }[];
    pointsHistory: { date: string; points: number }[];
    monthlyActivity: { month: string; activities: number }[];
  }> {
    const activities = this.customerActivity.get(userId) || [];
    const points = this.customerPoints.get(userId) || [];
    
    return {
      totalActivities: activities.length,
      activitiesByType: [],
      pointsHistory: points.map(p => ({
        date: p.createdAt?.toISOString() || '',
        points: p.totalPoints || 0
      })),
      monthlyActivity: []
    };
  }

  // Waves
  async getWaves(): Promise<Wave[]> {
    return Array.from(this.waves.values());
  }

  async getWave(id: string): Promise<Wave | undefined> {
    return this.waves.get(id);
  }

  async createWave(wave: InsertWave): Promise<Wave> { 
    const id = this.generateId();
    const newWave: Wave = { id, ...wave, createdAt: new Date(), updatedAt: new Date() };
    this.waves.set(id, newWave);
    return newWave;
  }

  async updateWave(id: string, wave: Partial<InsertWave>): Promise<Wave | undefined> {
    const existing = this.waves.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...wave, updatedAt: new Date() };
    this.waves.set(id, updated);
    return updated;
  }

  async deleteWave(id: string): Promise<boolean> {
    return this.waves.delete(id);
  }

  async getPropertiesByWave(waveId: string): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(p => p.waveId === waveId);
  }

  // Wave Permissions
  async getCustomerWavePermissions(userId: string): Promise<CustomerWavePermission[]> {
    return this.customerWavePermissions.get(userId) || [];
  }

  async grantWavePermission(permission: InsertCustomerWavePermission): Promise<CustomerWavePermission> {
    const userPerms = this.customerWavePermissions.get(permission.userId) || [];
    const newPerm: CustomerWavePermission = {
      id: this.generateId(),
      ...permission,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    userPerms.push(newPerm);
    this.customerWavePermissions.set(permission.userId, userPerms);
    return newPerm;
  }

  async revokeWavePermission(userId: string, waveId: string): Promise<boolean> {
    const userPerms = this.customerWavePermissions.get(userId) || [];
    const filtered = userPerms.filter(p => p.waveId !== waveId);
    this.customerWavePermissions.set(userId, filtered);
    return filtered.length < userPerms.length;
  }

  async getWavePermission(userId: string, waveId: string): Promise<CustomerWavePermission | undefined> {
    const userPerms = this.customerWavePermissions.get(userId) || [];
    return userPerms.find(p => p.waveId === waveId);
  }

  async updateWavePermission(id: string, permission: Partial<InsertCustomerWavePermission>): Promise<CustomerWavePermission | undefined> {
    for (const [userId, perms] of this.customerWavePermissions.entries()) {
      const index = perms.findIndex(p => p.id === id);
      if (index >= 0) {
        const updated = { ...perms[index], ...permission, updatedAt: new Date() };
        perms[index] = updated;
        return updated;
      }
    }
    return undefined;
  }

  async getUserWaveUsage(userId: string): Promise<{ waveId: string; used: number; max: number }[]> {
    return [];
  }

  async getUserRemainingWaves(userId: string): Promise<number> {
    return 10;
  }

  async updateUsersWithZeroWaveBalance(): Promise<void> {}

  async deductWaveBalance(userId: string, amount: number): Promise<boolean> {
    return true;
  }

  async addWaveBalance(userId: string, amount: number): Promise<boolean> {
    return true;
  }

  async checkWavePermission(userId: string, waveId: string | null | undefined): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true };
  }

  async incrementWaveUsage(userId: string, waveId: string | null | undefined): Promise<void> {}

  async decrementWaveUsage(userId: string, waveId: string | null | undefined): Promise<void> {}

  // Currency
  async getCurrencyRates(): Promise<CurrencyRate[]> {
    return Array.from(this.currencyRates.values());
  }

  async getActiveCurrencyRates(): Promise<CurrencyRate[]> {
    return Array.from(this.currencyRates.values()).filter(r => r.isActive);
  }

  async getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<CurrencyRate | undefined> {
    return Array.from(this.currencyRates.values()).find(
      r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency && r.isActive
    );
  }

  async createCurrencyRate(rate: InsertCurrencyRate): Promise<CurrencyRate> {
    const id = this.generateId();
    const newRate: CurrencyRate = { id, ...rate, createdAt: new Date(), updatedAt: new Date() };
    this.currencyRates.set(id, newRate);
    return newRate;
  }

  async updateCurrencyRate(id: string, rate: UpdateCurrencyRate): Promise<CurrencyRate | undefined> {
    const existing = this.currencyRates.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...rate, updatedAt: new Date() };
    this.currencyRates.set(id, updated);
    return updated;
  }

  async deactivateCurrencyRate(id: string): Promise<boolean> {
    const rate = this.currencyRates.get(id);
    if (!rate) return false;
    rate.isActive = false;
    rate.updatedAt = new Date();
    return true;
  }

  async convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getCurrencyRate(fromCurrency, toCurrency);
    return rate ? amount * rate.rate : amount;
  }

  // Client Locations
  async createClientLocation(location: InsertClientLocation): Promise<ClientLocation> {
    return this.addClientLocation(location);
  }

  async addClientLocation(location: InsertClientLocation): Promise<ClientLocation> {
    const id = this.generateId();
    const newLocation: ClientLocation = { id, ...location, createdAt: new Date() };
    this.clientLocations.set(id, newLocation);
    return newLocation;
  }

  async getClientLocations(filters?: any, limit?: number): Promise<ClientLocation[]> {
    return Array.from(this.clientLocations.values());
  }

  async countClientLocations(filters?: any): Promise<number> {
    return this.clientLocations.size;
  }

  async getClientLocationStats(): Promise<any> {
    return { total: this.clientLocations.size, byCountry: [], byCity: [] };
  }
}