import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, 'frontend', 'public', 'screenshots');
const MAX_WIDTH = 1200;
const MAX_SIZE_KB = 300;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

async function resizeAndCompress(inputPath, outputPath, format = 'webp') {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    const needsResize = metadata.width > MAX_WIDTH;
    
    let pipeline = sharp(inputPath);
    
    // Resize if needed (maintain aspect ratio)
    if (needsResize) {
      pipeline = pipeline.resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Compress based on format
    if (format === 'webp') {
      // Start with high quality and reduce if needed
      let quality = 85;
      let outputBuffer;
      
      // Try to get under 300KB by adjusting quality
      for (let attempt = 0; attempt < 5; attempt++) {
        outputBuffer = await pipeline
          .webp({
            quality: quality,
            effort: 6,
            lossless: false
          })
          .toBuffer();
        
        if (outputBuffer.length <= MAX_SIZE_BYTES || quality <= 60) {
          break;
        }
        
        // Reduce quality by 5 each attempt
        quality -= 5;
      }
      
      // If still too large, try PNG optimization
      if (outputBuffer.length > MAX_SIZE_BYTES) {
        console.log(`  ⚠ WebP still too large (${(outputBuffer.length / 1024).toFixed(0)}KB), trying optimized PNG...`);
        
        // Try optimized PNG
        quality = 90;
        for (let attempt = 0; attempt < 5; attempt++) {
          outputBuffer = await sharp(inputPath)
            .resize(needsResize ? MAX_WIDTH : null, null, {
              withoutEnlargement: true,
              fit: 'inside'
            })
            .png({
              quality: quality,
              compressionLevel: 9,
              adaptiveFiltering: true,
              palette: true
            })
            .toBuffer();
          
          if (outputBuffer.length <= MAX_SIZE_BYTES || quality <= 70) {
            format = 'png';
            break;
          }
          quality -= 5;
        }
      }
      
      // Write the file
      const finalPath = format === 'webp' ? outputPath : outputPath.replace('.webp', '.png');
      fs.writeFileSync(finalPath, outputBuffer);
      
      return {
        success: true,
        originalSize,
        newSize: outputBuffer.length,
        reduction: ((originalSize - outputBuffer.length) / originalSize * 100).toFixed(1),
        format: format,
        resized: needsResize,
        originalWidth: metadata.width,
        newWidth: needsResize ? MAX_WIDTH : metadata.width
      };
    } else {
      // PNG optimization
      let quality = 90;
      let outputBuffer;
      
      for (let attempt = 0; attempt < 5; attempt++) {
        outputBuffer = await pipeline
          .png({
            quality: quality,
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: true
          })
          .toBuffer();
        
        if (outputBuffer.length <= MAX_SIZE_BYTES || quality <= 70) {
          break;
        }
        quality -= 5;
      }
      
      fs.writeFileSync(outputPath, outputBuffer);
      
      return {
        success: true,
        originalSize,
        newSize: outputBuffer.length,
        reduction: ((originalSize - outputBuffer.length) / originalSize * 100).toFixed(1),
        format: 'png',
        resized: needsResize,
        originalWidth: metadata.width,
        newWidth: needsResize ? MAX_WIDTH : metadata.width
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function processAllScreenshots() {
  const files = fs.readdirSync(screenshotsDir);
  const imageFiles = files.filter(file => 
    (file.endsWith('.png') || file.endsWith('.webp')) && 
    !file.includes('backup')
  );
  
  console.log(`Found ${imageFiles.length} image files to process...\n`);
  console.log(`Target: Max width ${MAX_WIDTH}px, Max size ${MAX_SIZE_KB}KB\n`);
  
  const results = [];
  
  for (const file of imageFiles) {
    const inputPath = path.join(screenshotsDir, file);
    const isWebP = file.endsWith('.webp');
    const baseName = file.replace(/\.(png|webp)$/, '');
    const outputPath = path.join(screenshotsDir, `${baseName}.webp`);
    const tempPath = path.join(screenshotsDir, `${baseName}.temp.webp`);
    
    console.log(`Processing ${file}...`);
    
    // Process the image
    const result = await resizeAndCompress(inputPath, tempPath, 'webp');
    
    if (result.success) {
      // Replace original with optimized version
      if (fs.existsSync(tempPath)) {
        // If result format is PNG, use that instead
        if (result.format === 'png') {
          const pngPath = path.join(screenshotsDir, `${baseName}.png`);
          if (fs.existsSync(tempPath.replace('.webp', '.png'))) {
            fs.renameSync(tempPath.replace('.webp', '.png'), pngPath);
          }
          // Remove old files
          if (fs.existsSync(inputPath) && inputPath !== pngPath) fs.unlinkSync(inputPath);
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          if (fs.existsSync(outputPath) && outputPath !== pngPath) fs.unlinkSync(outputPath);
        } else {
          // Use WebP
          if (fs.existsSync(outputPath) && outputPath !== tempPath) fs.unlinkSync(outputPath);
          fs.renameSync(tempPath, outputPath);
          // Remove old PNG if we have WebP now
          const oldPng = path.join(screenshotsDir, `${baseName}.png`);
          if (fs.existsSync(oldPng) && oldPng !== inputPath) {
            // Keep PNG as fallback only if it's smaller
            const pngStats = fs.statSync(oldPng);
            if (pngStats.size > result.newSize) {
              fs.unlinkSync(oldPng);
            }
          }
          if (fs.existsSync(inputPath) && inputPath !== outputPath && !inputPath.endsWith('.png')) {
            fs.unlinkSync(inputPath);
          }
        }
      }
      
      const originalMB = (result.originalSize / 1024 / 1024).toFixed(2);
      const newKB = (result.newSize / 1024).toFixed(0);
      const resizeInfo = result.resized 
        ? ` (resized from ${result.originalWidth}px)` 
        : '';
      
      const status = result.newSize <= MAX_SIZE_BYTES ? '✓' : '⚠';
      console.log(`  ${status} ${originalMB}MB → ${newKB}KB, ${result.format.toUpperCase()}${resizeInfo} (${result.reduction}% reduction)`);
      
      if (result.newSize > MAX_SIZE_BYTES) {
        console.log(`  ⚠ Warning: File size (${newKB}KB) exceeds target (${MAX_SIZE_KB}KB)`);
      }
      
      results.push({
        file: `${baseName}.${result.format}`,
        originalSize: result.originalSize,
        newSize: result.newSize,
        reduction: result.reduction,
        format: result.format,
        resized: result.resized
      });
    } else {
      console.log(`  ✗ Error: ${result.error}`);
    }
  }
  
  console.log('\n=== Processing Summary ===');
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);
  const totalReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
  const avgSize = (totalNew / results.length / 1024).toFixed(0);
  
  console.log(`Total size: ${(totalOriginal / 1024 / 1024).toFixed(2)}MB → ${(totalNew / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Overall reduction: ${totalReduction}%`);
  console.log(`Average file size: ${avgSize}KB`);
  console.log(`Files under ${MAX_SIZE_KB}KB: ${results.filter(r => r.newSize <= MAX_SIZE_BYTES).length}/${results.length}`);
}

processAllScreenshots().catch(console.error);

