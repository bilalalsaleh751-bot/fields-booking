import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, 'frontend', 'public', 'screenshots');

async function convertToWebP(inputPath, outputPath) {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    // Convert to WebP with aggressive compression while maintaining quality
    await sharp(inputPath)
      .webp({
        quality: 85, // High quality but compressed
        effort: 6,   // Maximum compression effort (0-6)
        lossless: false,
        nearLossless: false
      })
      .toFile(outputPath);
    
    const newStats = fs.statSync(outputPath);
    const newSize = newStats.size;
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    return {
      success: true,
      originalSize,
      newSize,
      reduction
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function convertAllScreenshots() {
  const files = fs.readdirSync(screenshotsDir);
  const pngFiles = files.filter(file => file.endsWith('.png') && !file.includes('backup'));
  
  console.log(`Found ${pngFiles.length} PNG files to convert to WebP...\n`);
  
  const results = [];
  
  for (const file of pngFiles) {
    const inputPath = path.join(screenshotsDir, file);
    const outputPath = path.join(screenshotsDir, file.replace('.png', '.webp'));
    
    console.log(`Converting ${file} to WebP...`);
    
    const result = await convertToWebP(inputPath, outputPath);
    
    if (result.success) {
      const originalMB = (result.originalSize / 1024 / 1024).toFixed(2);
      const newMB = (result.newSize / 1024 / 1024).toFixed(2);
      
      console.log(`  ✓ Converted: ${originalMB}MB → ${newMB}MB (${result.reduction}% reduction)`);
      
      results.push({
        file: file.replace('.png', '.webp'),
        originalSize: result.originalSize,
        newSize: result.newSize,
        reduction: result.reduction
      });
    } else {
      console.log(`  ✗ Error: ${result.error}`);
    }
  }
  
  console.log('\n=== Conversion Summary ===');
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);
  const totalReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
  
  console.log(`Total size reduction: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalNew / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Overall reduction: ${totalReduction}%`);
  console.log(`\nWebP files created. PNG files kept as fallback.`);
}

convertAllScreenshots().catch(console.error);

