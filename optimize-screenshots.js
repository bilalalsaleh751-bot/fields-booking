import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, 'frontend', 'public', 'screenshots');

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    // Optimize PNG with sharp - compress and optimize
    await sharp(inputPath)
      .png({
        quality: 90,
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true
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

async function optimizeAllScreenshots() {
  const files = fs.readdirSync(screenshotsDir);
  const pngFiles = files.filter(file => file.endsWith('.png'));
  
  console.log(`Found ${pngFiles.length} PNG files to optimize...\n`);
  
  // Create backup directory
  const backupDir = path.join(screenshotsDir, 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const results = [];
  
  for (const file of pngFiles) {
    const inputPath = path.join(screenshotsDir, file);
    const backupPath = path.join(backupDir, file);
    const tempPath = path.join(screenshotsDir, file.replace('.png', '.optimized.png'));
    
    console.log(`Optimizing ${file}...`);
    
    // Backup original
    fs.copyFileSync(inputPath, backupPath);
    
    // Optimize
    const result = await optimizeImage(inputPath, tempPath);
    
    if (result.success) {
      // Replace original with optimized version
      fs.renameSync(tempPath, inputPath);
      
      const originalMB = (result.originalSize / 1024 / 1024).toFixed(2);
      const newMB = (result.newSize / 1024 / 1024).toFixed(2);
      
      console.log(`  ✓ Reduced from ${originalMB}MB to ${newMB}MB (${result.reduction}% reduction)`);
      
      results.push({
        file,
        originalSize: result.originalSize,
        newSize: result.newSize,
        reduction: result.reduction
      });
    } else {
      console.log(`  ✗ Error: ${result.error}`);
      // Restore from backup if optimization failed
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }
  
  console.log('\n=== Optimization Summary ===');
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);
  const totalReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
  
  console.log(`Total size reduction: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalNew / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Overall reduction: ${totalReduction}%`);
  console.log(`\nOriginal files backed up to: ${backupDir}`);
}

optimizeAllScreenshots().catch(console.error);

