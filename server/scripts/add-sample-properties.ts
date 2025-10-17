import { StorageFactory } from "../storageFactory";

async function addSampleProperties() {
  try {
    const storage = await StorageFactory.getStorage();
    
    console.log("Adding sample properties with different types...");
    
    // Add apartment
    const apartment = await storage.createProperty({
      title: "Modern Apartment in Erbil Center",
      description: "Beautiful 2-bedroom apartment in the heart of Erbil with modern amenities and city views.",
      type: "apartment",
      listingType: "sale",
      price: "85000",
      currency: "USD",
      bedrooms: 2,
      bathrooms: 1,
      area: 120,
      address: "60 Meter Street",
      city: "Erbil",
      country: "Iraq",
      latitude: "36.191113",
      longitude: "44.009167",
      featured: false,
      language: "en",
      visible: true
    }, ["/uploads/properties/1759082074149-xrejrtvx6.jpg"]);
    console.log("✅ Created apartment:", apartment.title);
    
    // Add villa
    const villa = await storage.createProperty({
      title: "Luxury Villa in Sami Abdulrahman Park Area",
      description: "Stunning 4-bedroom villa with private garden and swimming pool near the park.",
      type: "villa",
      listingType: "sale",
      price: "350000",
      currency: "USD",
      bedrooms: 4,
      bathrooms: 3,
      area: 400,
      address: "Sami Abdulrahman Park",
      city: "Erbil",
      country: "Iraq",
      latitude: "36.178889",
      longitude: "44.008333",
      featured: false,
      language: "en",
      visible: true
    }, ["/uploads/properties/1759082074149-xrejrtvx6.jpg"]);
    console.log("✅ Created villa:", villa.title);
    
    // Add land
    const land = await storage.createProperty({
      title: "Commercial Land in Baharka",
      description: "Prime commercial land plot suitable for development, located in a growing area.",
      type: "land",
      listingType: "sale",
      price: "120000",
      currency: "USD",
      bedrooms: 0,
      bathrooms: 0,
      area: 500,
      address: "Baharka Road",
      city: "Baharka",
      country: "Iraq",
      latitude: "36.298889",
      longitude: "44.051667",
      featured: false,
      language: "en",
      visible: true
    }, ["/uploads/properties/1759082074149-xrejrtvx6.jpg"]);
    console.log("✅ Created land:", land.title);
    
    // Add another apartment for rent
    const apartmentRent = await storage.createProperty({
      title: "Apartment for Rent in Dream City",
      description: "Spacious 3-bedroom apartment available for rent in the popular Dream City complex.",
      type: "apartment",
      listingType: "rent",
      price: "750",
      currency: "USD",
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
      address: "Dream City",
      city: "Erbil",
      country: "Iraq",
      latitude: "36.225556",
      longitude: "43.995278",
      featured: false,
      language: "en",
      visible: true
    }, ["/uploads/properties/1759082074149-xrejrtvx6.jpg"]);
    console.log("✅ Created apartment for rent:", apartmentRent.title);
    
    console.log("\n🎉 Successfully added 4 sample properties!");
    console.log("Now you can test the filters:");
    console.log("  - Houses: 1 property");
    console.log("  - Apartments: 2 properties");
    console.log("  - Villa: 1 property");
    console.log("  - Land: 1 property");
    
  } catch (error) {
    console.error("❌ Error adding sample properties:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

addSampleProperties();
