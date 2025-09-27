import { db, initializeDb } from "./db";
import { users } from "@shared/schema";
import { hashPassword } from "./auth";
import { randomUUID } from "crypto";

async function createAdminUser() {
  try {
    console.log("🔧 Initializing database...");
    await initializeDb();
    
    console.log("🔧 Creating admin user...");

    // Create admin user
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

    console.log("✅ Created admin user: admin");
    console.log("📧 Email: admin@estateai.com");
    console.log("🔑 Username: admin");
    console.log("🔑 Password: admin123");
    console.log("👤 Role: super_admin");

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

    console.log("✅ Created agent user: john_agent");
    console.log("📧 Email: john@estateai.com");
    console.log("🔑 Username: john_agent");
    console.log("🔑 Password: agent123");
    console.log("👤 Role: agent");

    console.log("🎉 Users created successfully!");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser().then(() => {
  console.log("✅ Admin creation completed successfully!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Failed to create admin:", error);
  process.exit(1);
});