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

    // Try MySQL first (for local development)
    try {
      await initializeDb();
      console.log("✅ MySQL database initialized successfully");
      
      // Create DatabaseStorage instance
      const { DatabaseStorage } = await import("./storage");
      this.instance = new DatabaseStorage();
      console.log("🔗 Using MySQL DatabaseStorage");
    } catch (error) {
      console.warn("⚠️ MySQL connection failed, using in-memory storage");
      console.warn("💡 For MySQL support locally, ensure XAMPP is running with MySQL on port 3306");
      this.instance = new MemStorage();
      console.log("💾 Using MemStorage (in-memory)");
    }

    this.isInitialized = true;
    return this.instance;
  }

  // For synchronous access after initialization
  static getInstance(): IStorage {
    if (!this.instance || !this.isInitialized) {
      throw new Error("Storage not initialized. Call getStorage() first.");
    }
    return this.instance;
  }
}

export { StorageFactory };