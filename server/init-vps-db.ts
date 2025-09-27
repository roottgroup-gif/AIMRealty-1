import { db, initializeDb } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

async function initializeVpsDatabase() {
  try {
    console.log("🔧 Initializing VPS database...");
    await initializeDb();
    
    console.log("🔍 Checking for existing admin users...");
    
    // Check if admin already exists
    const existingAdmin = await db().select().from(users).where(eq(users.username, "admin")).limit(1);
    const existingAgent = await db().select().from(users).where(eq(users.username, "john_agent")).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log("🔧 Creating admin user in VPS database...");

      // Create admin user with proper password hashing
      const hashedPassword = await hashPassword("admin123");
      const adminId = randomUUID();
      
      await db().insert(users).values([{
        id: adminId,
        username: "admin",
        email: "admin@estateai.com", 
        password: hashedPassword,
        role: "super_admin",
        firstName: "System",
        lastName: "Admin",
        phone: "+964 750 000 0000",
        isVerified: true
      }]);

      console.log("✅ Created admin user in VPS database");
      console.log("👤 Username: admin");
      console.log("🔑 Password: admin123");
      console.log("👑 Role: super_admin");
    } else {
      console.log("ℹ️ Admin user already exists in VPS database");
    }

    if (existingAgent.length === 0) {
      console.log("🔧 Creating agent user in VPS database...");

      // Create sample agent
      const hashedAgentPassword = await hashPassword("agent123");
      const agentId = randomUUID();
      
      await db().insert(users).values([{
        id: agentId,
        username: "john_agent",
        email: "john@estateai.com",
        password: hashedAgentPassword,
        role: "agent", 
        firstName: "John",
        lastName: "Smith",
        phone: "+964 750 123 4567",
        isVerified: true
      }]);

      console.log("✅ Created agent user in VPS database");
      console.log("👤 Username: john_agent");  
      console.log("🔑 Password: agent123");
      console.log("👑 Role: agent");
    } else {
      console.log("ℹ️ Agent user already exists in VPS database");
    }

    console.log("🎉 VPS database initialization completed successfully!");
    
    // Test database connection health
    console.log("🔍 Testing database health...");
    const userCount = await db().select().from(users);
    console.log(`📊 Total users in database: ${userCount.length}`);

  } catch (error) {
    console.error("❌ Error initializing VPS database:", error);
    console.error("🔧 This is likely due to IP permissions.");
    console.error("📋 Run the MySQL permission fix commands provided separately.");
    process.exit(1);
  }
}

// Allow running this script directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeVpsDatabase().then(() => {
    console.log("✅ VPS database initialization completed!");
    process.exit(0);
  }).catch((error) => {
    console.error("❌ Failed to initialize VPS database:", error);
    process.exit(1);
  });
}

export { initializeVpsDatabase };