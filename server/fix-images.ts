import { StorageFactory } from "./storageFactory";

async function fixPropertyImages() {
  console.log("🔧 Starting image path fix...");
  
  const storage = await StorageFactory.getStorage();
  
  // Property with broken image reference
  const problemPropertyId = "f6fc1595-5cb4-41a4-b82a-ed91603ed88b";
  const brokenImagePath = "/uploads/properties/1759084255514-9uzqbgagq.jpg";
  const workingImagePath = "/uploads/properties/1759082074149-xrejrtvx6.jpg"; // This file exists but isn't used
  
  try {
    // Get the property to check current images
    const property = await storage.getProperty(problemPropertyId);
    console.log("📋 Current property images:", property?.images);
    
    if (!property) {
      console.log("❌ Property not found");
      return;
    }
    
    // Check if the broken image exists in the property
    const brokenImage = property.images?.find(img => img.imageUrl === brokenImagePath);
    if (brokenImage) {
      console.log("🔧 Removing broken image reference...");
      await storage.removePropertyImage(problemPropertyId, brokenImagePath);
      
      console.log("✅ Adding working image reference...");
      await storage.addPropertyImage({
        propertyId: problemPropertyId,
        imageUrl: workingImagePath,
        sortOrder: 0,
        altText: null
      });
      
      console.log("✅ Image path fixed successfully!");
    } else {
      console.log("❌ Broken image reference not found in property");
    }
    
    // Verify the fix
    const updatedProperty = await storage.getProperty(problemPropertyId);
    console.log("📋 Updated property images:", updatedProperty?.images);
    
  } catch (error) {
    console.error("❌ Error fixing images:", error);
  }
}

fixPropertyImages().then(() => {
  console.log("🎉 Image fix completed");
  process.exit(0);
}).catch(error => {
  console.error("💥 Script failed:", error);
  process.exit(1);
});