import { IStorage } from "./storage";
import { MemStorage } from "./memStorage";
import { initializeDb } from "./db";

// Storage factory that determines the best storage implementation to use
class StorageFactory {
  private static instance: IStorage | null = null;
  private static isInitialized = false;

  static async getStorage(): Promise<IStorage> {
    if (this.instance && this.isInitialized) {
      return this.instance;
    }

    // Check if MySQL VPS database is explicitly configured
    const isVpsConfigured = process.env.MYSQL_URL || 
      (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
    
    try {
      await initializeDb();
      console.log("✅ MySQL database initialized successfully");
      
      // Create DatabaseStorage instance
      const { DatabaseStorage } = await import("./storage");
      this.instance = new DatabaseStorage();
      console.log("🔗 Using MySQL DatabaseStorage");
      
      // Initialize default users if they don't exist
      await this.initializeDefaultUsers(this.instance);
    } catch (error) {
      // If VPS database is configured but failing, don't fall back to MemStorage
      if (isVpsConfigured) {
        console.error("❌ VPS database is configured but connection failed!");
        console.error("🔧 Fix the database connection issue before proceeding.");
        console.error("💡 Check IP permissions and database credentials.");
        throw new Error(`VPS database connection failed: ${error}`);
      }
      
      // Only fall back to MemStorage if no database is configured (local dev)
      console.warn("⚠️ No database configured, using in-memory storage for development");
      console.warn("💡 Set MYSQL_URL environment variable to use a database");
      this.instance = new MemStorage();
      console.log("💾 Using MemStorage (in-memory) - DEVELOPMENT ONLY");
    }

    this.isInitialized = true;
    return this.instance;
  }

  // For synchronous access after initialization
  static getInstance(): IStorage {
    if (!this.instance || !this.isInitialized) {
      throw new Error("Storage not initialized. Call getStorage() first.");
    }
    return this.instance!;
  }

  // Initialize default users in MySQL if they don't exist
  private static async initializeDefaultUsers(storage: IStorage): Promise<void> {
    try {
      // Check if admin user exists
      const adminUser = await storage.getUserByUsername('admin');
      
      if (!adminUser) {
        console.log('🔧 Creating default admin user...');
        
        // Create admin user
        await storage.createUser({
          username: 'admin',
          email: 'admin@estateai.com',
          password: 'admin123', // Will be hashed by createUser
          role: 'super_admin',
          firstName: 'System',
          lastName: 'Admin',
          phone: '+964 750 000 0000',
          isVerified: true
        });
        
        console.log('✅ Default admin user created');
        console.log('🔑 Username: admin, Password: admin123');
      }
      
      // Check if agent user exists
      const agentUser = await storage.getUserByUsername('john_agent');
      
      if (!agentUser) {
        console.log('🔧 Creating default agent user...');
        
        // Create agent user
        await storage.createUser({
          username: 'john_agent',
          email: 'john@estateai.com',
          password: 'agent123', // Will be hashed by createUser
          role: 'agent',
          firstName: 'John',
          lastName: 'Smith',
          phone: '+964 750 123 4567',
          isVerified: true
        });
        
        console.log('✅ Default agent user created');
        console.log('🔑 Username: john_agent, Password: agent123');
      }
      
      if (adminUser && agentUser) {
        console.log('ℹ️ Default users already exist in database');
      }
      
    } catch (error) {
      console.error('❌ Error initializing default users:', error);
    }
  }
}

export { StorageFactory };