import { StorageFactory } from "../server/storageFactory";

async function deletePropertiesExceptFarman() {
  try {
    console.log("🔄 Initializing storage...");
    const storage = await StorageFactory.getStorage();
    
    // Find the user "farman"
    console.log("🔍 Looking for user 'farman'...");
    let farmanUser = await storage.getUserByUsername("farman");
    
    if (!farmanUser) {
      // Try to find by email
      const allUsers = await storage.getAllUsers();
      farmanUser = allUsers.find(u => 
        u.email?.toLowerCase().includes("farman") || 
        u.username?.toLowerCase().includes("farman") ||
        u.firstName?.toLowerCase().includes("farman")
      );
    }
    
    if (!farmanUser) {
      console.log("⚠️ User 'farman' not found. No properties will be preserved.");
      console.log("❓ Do you want to continue and delete ALL properties? (This script will not proceed without manual confirmation in code)");
      return;
    }
    
    console.log(`✅ Found user: ${farmanUser.username} (${farmanUser.email}) - ID: ${farmanUser.id}`);
    console.log(`📋 First Name: ${farmanUser.firstName}`);
    
    // Get all properties
    console.log("\n🔍 Fetching all properties...");
    const allProperties = await storage.getProperties();
    console.log(`📊 Total properties in database: ${allProperties.length}`);
    
    // Separate farman's properties from others
    const farmanProperties = allProperties.filter(p => p.agentId === farmanUser!.id);
    const otherProperties = allProperties.filter(p => p.agentId !== farmanUser!.id);
    
    console.log(`\n📈 Properties breakdown:`);
    console.log(`   - Farman's properties (will be kept): ${farmanProperties.length}`);
    console.log(`   - Other properties (will be deleted): ${otherProperties.length}`);
    
    if (farmanProperties.length > 0) {
      console.log(`\n🏠 Farman's properties that will be KEPT:`);
      farmanProperties.forEach(p => {
        console.log(`   - ${p.title} (${p.city})`);
      });
    }
    
    if (otherProperties.length > 0) {
      console.log(`\n🗑️  Properties that will be DELETED:`);
      otherProperties.forEach(p => {
        console.log(`   - ${p.title} (${p.city}) - Owner: ${p.agentId || 'none'}`);
      });
      
      console.log(`\n⚠️  Starting deletion of ${otherProperties.length} properties...`);
      
      let deletedCount = 0;
      for (const property of otherProperties) {
        try {
          const success = await storage.deleteProperty(property.id);
          if (success) {
            deletedCount++;
            console.log(`   ✅ Deleted: ${property.title}`);
          }
        } catch (error) {
          console.error(`   ❌ Failed to delete ${property.title}:`, error);
        }
      }
      
      console.log(`\n✅ Deletion complete!`);
      console.log(`   - Properties deleted: ${deletedCount}`);
      console.log(`   - Properties kept (farman's): ${farmanProperties.length}`);
    } else {
      console.log("\n✨ No properties to delete. All existing properties belong to farman.");
    }
    
    // Verify final count
    const remainingProperties = await storage.getProperties();
    console.log(`\n📊 Final property count: ${remainingProperties.length}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Run the script
deletePropertiesExceptFarman()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
