import { db, initializeDb } from "./db";
import { propertyImages, properties, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ImageInfo {
  id: number;
  propertyId: string;
  propertyTitle: string;
  imageUrl: string;
  sortOrder: number;
  altText: string | null;
  fileExists: boolean;
  filePath: string;
  fileSize?: string;
}

async function showAllImages() {
  try {
    console.log("🔧 Initializing MySQL VPS connection...");
    await initializeDb();
    
    console.log("📊 Fetching all images from database...\n");
    
    // Get all property images with property details
    const images = await db()
      .select({
        id: propertyImages.id,
        propertyId: propertyImages.propertyId,
        imageUrl: propertyImages.imageUrl,
        sortOrder: propertyImages.sortOrder,
        altText: propertyImages.altText,
        propertyTitle: properties.title,
      })
      .from(propertyImages)
      .leftJoin(properties, eq(propertyImages.propertyId, properties.id))
      .orderBy(propertyImages.propertyId, propertyImages.sortOrder);
    
    if (images.length === 0) {
      console.log("⚠️ No images found in database");
      return;
    }
    
    console.log(`✅ Found ${images.length} images in database\n`);
    console.log("="  .repeat(100));
    
    // Determine the uploads directory path
    const uploadsPath = path.join(__dirname, "../server/uploads");
    
    const imageDetails: ImageInfo[] = [];
    
    // Check each image file
    for (const img of images) {
      let filePath = "";
      let fileExists = false;
      let fileSize = "";
      
      // Parse image URL to get file path
      const imageUrl = img.imageUrl || "";
      
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        // External URL
        filePath = imageUrl;
        fileExists = true; // Assume external URLs exist
      } else {
        // Local file - check if it exists
        const localPath = imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl;
        filePath = path.join(__dirname, "..", localPath);
        
        try {
          const stats = fs.statSync(filePath);
          fileExists = true;
          const sizeInKB = (stats.size / 1024).toFixed(2);
          fileSize = `${sizeInKB} KB`;
        } catch (error) {
          fileExists = false;
        }
      }
      
      imageDetails.push({
        id: img.id,
        propertyId: img.propertyId,
        propertyTitle: img.propertyTitle || "Unknown Property",
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder || 0,
        altText: img.altText,
        fileExists,
        filePath,
        fileSize,
      });
    }
    
    // Group images by property
    const imagesByProperty = imageDetails.reduce((acc, img) => {
      if (!acc[img.propertyId]) {
        acc[img.propertyId] = [];
      }
      acc[img.propertyId].push(img);
      return acc;
    }, {} as Record<string, ImageInfo[]>);
    
    // Display images grouped by property
    let propertyCount = 0;
    let existingCount = 0;
    let missingCount = 0;
    
    for (const [propertyId, propertyImages] of Object.entries(imagesByProperty)) {
      propertyCount++;
      const firstImage = propertyImages[0];
      
      console.log(`\n📦 Property ${propertyCount}: ${firstImage.propertyTitle}`);
      console.log(`   Property ID: ${propertyId}`);
      console.log(`   Total Images: ${propertyImages.length}`);
      console.log(`   ${"-".repeat(90)}`);
      
      propertyImages.forEach((img, index) => {
        const status = img.fileExists ? "✅" : "❌";
        const sizeInfo = img.fileSize ? ` (${img.fileSize})` : "";
        
        if (img.fileExists) {
          existingCount++;
        } else {
          missingCount++;
        }
        
        console.log(`   ${status} Image ${index + 1}:`);
        console.log(`      ID: ${img.id}`);
        console.log(`      URL: ${img.imageUrl}`);
        console.log(`      Sort Order: ${img.sortOrder}`);
        console.log(`      Alt Text: ${img.altText || "N/A"}`);
        console.log(`      File Path: ${img.filePath}${sizeInfo}`);
        console.log(`      Status: ${img.fileExists ? "File Exists" : "File Missing"}`);
        console.log("");
      });
    }
    
    // Summary
    console.log("=" .repeat(100));
    console.log("\n📈 Summary:");
    console.log(`   Total Properties with Images: ${propertyCount}`);
    console.log(`   Total Images in Database: ${images.length}`);
    console.log(`   ✅ Existing Files: ${existingCount}`);
    console.log(`   ❌ Missing Files: ${missingCount}`);
    
    if (missingCount > 0) {
      console.log(`\n⚠️ Warning: ${missingCount} image(s) are in the database but files are missing!`);
    } else {
      console.log("\n🎉 All images in database have corresponding files!");
    }
    
  } catch (error: any) {
    console.error("\n❌ Error showing images:", error.message);
    throw error;
  }
}

// Run the script
showAllImages()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
