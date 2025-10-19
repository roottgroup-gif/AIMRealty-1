import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../attached_assets/cover_1760902394879.jpg');
const outputPath = path.join(__dirname, '../client/public/mapestate-social-preview.png');

async function convertImage() {
  try {
    console.log('🖼️  Converting and optimizing new social preview image...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📁 Output: ${outputPath}`);
    
    const inputStats = fs.statSync(inputPath);
    console.log(`📊 Original size: ${(inputStats.size / 1024).toFixed(2)} KB`);
    
    await sharp(inputPath)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .png({
        quality: 90,
        compressionLevel: 9
      })
      .toFile(outputPath);
    
    const outputStats = fs.statSync(outputPath);
    console.log(`📊 Final size: ${(outputStats.size / 1024).toFixed(2)} KB`);
    console.log(`✅ Image converted and optimized successfully!`);
    console.log(`🎨 Format: JPG → PNG`);
    console.log(`📐 Dimensions: 1200x630 (optimized for social media)`);
    
  } catch (error) {
    console.error('❌ Error converting image:', error);
    process.exit(1);
  }
}

convertImage();
