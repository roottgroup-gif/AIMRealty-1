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
    const isVpsConfigured = process.env.MYSQL_URL;
    
    try {
      await initializeDb();
      console.log("✅ MySQL database initialized successfully");
      
      // Create DatabaseStorage instance
      const { DatabaseStorage } = await import("./storage");
      this.instance = new DatabaseStorage();
      console.log("🔗 Using MySQL DatabaseStorage");
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
}

export { StorageFactory };