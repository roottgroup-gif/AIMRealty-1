import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../client/public/mapestate-social-preview.png');
const outputPath = path.join(__dirname, '../client/public/mapestate-social-preview-optimized.png');

async function optimizeImage() {
  try {
    console.log('🖼️  Optimizing social preview image...');
    console.log(`📁 Input: ${inputPath}`);
    
    const inputStats = fs.statSync(inputPath);
    console.log(`📊 Original size: ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    await sharp(inputPath)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .png({
        quality: 85,
        compressionLevel: 9,
        palette: true
      })
      .toFile(outputPath);
    
    const outputStats = fs.statSync(outputPath);
    console.log(`📊 Optimized size: ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✨ Reduction: ${((1 - outputStats.size / inputStats.size) * 100).toFixed(2)}%`);
    
    fs.renameSync(outputPath, inputPath);
    console.log('✅ Image optimized successfully!');
    
  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    process.exit(1);
  }
}

optimizeImage();
