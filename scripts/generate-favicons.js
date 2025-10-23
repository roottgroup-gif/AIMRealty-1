import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../client/public/logo_1757848527935.png');
const outputDir = path.join(__dirname, '../client/public');

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 192, name: 'favicon-192x192.png' },
  { size: 512, name: 'favicon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

async function generateFavicons() {
  try {
    console.log('🎨 Generating optimized favicons for Google Search...');
    console.log(`📁 Input: ${inputPath}`);
    
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Logo file not found at ${inputPath}`);
    }
    
    const inputStats = fs.statSync(inputPath);
    console.log(`📊 Original size: ${(inputStats.size / 1024).toFixed(2)} KB`);
    
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`✅ Created ${name} (${size}x${size}) - ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
    console.log('✨ All favicons generated successfully!');
    console.log('📌 These files will help Google display your logo in search results');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
