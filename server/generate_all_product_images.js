#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const { PRODUCTS, CATEGORY } = require('./models');
const { generateProductImage } = require('./functions/imageService');

async function generateImagesForAllProducts() {
    console.log('🎨 Starting to generate real images for all existing products...');
    console.log('📸 Using Unsplash API to download professional photos\n');
    
    try {
        // Get all products with their categories
        const products = await PRODUCTS.findAll({
            include: [{
                model: CATEGORY,
                as: 'category',
                attributes: ['CategoryName']
            }]
        });
        
        console.log(`📦 Found ${products.length} products to process\n`);
        
        let successCount = 0;
        let failCount = 0;
        
        // Process each product
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const categoryName = product.category ? product.category.CategoryName : 'Food';
            
            console.log(`\n[${i + 1}/${products.length}] Processing: ${product.ProductName}`);
            console.log(`   Category: ${categoryName}`);
            console.log(`   Current Image: ${product.ProductImage}`);
            
            try {
                // Generate real image using Unsplash API
                const result = await generateProductImage(product.ProductName, categoryName);
                
                if (result.success) {
                    // Update product with new image filename
                    await PRODUCTS.update(
                        { ProductImage: result.imagePath },
                        { where: { ProductID: product.ProductID } }
                    );
                    
                    console.log(`   ✅ SUCCESS: Downloaded from photographer "${result.imageInfo.photographer}"`);
                    console.log(`   📁 New Image: ${result.imagePath}`);
                    successCount++;
                    
                    // Add small delay to be nice to the API
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.log(`   ❌ FAILED: ${result.error}`);
                    console.log(`   🔄 Keeping existing image: ${product.ProductImage}`);
                    failCount++;
                }
            } catch (error) {
                console.log(`   ❌ ERROR: ${error.message}`);
                console.log(`   🔄 Keeping existing image: ${product.ProductImage}`);
                failCount++;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 BATCH IMAGE GENERATION COMPLETE!');
        console.log('='.repeat(60));
        console.log(`✅ Successfully generated: ${successCount} images`);
        console.log(`❌ Failed/Skipped: ${failCount} images`);
        console.log(`📊 Success rate: ${Math.round((successCount / products.length) * 100)}%`);
        
        if (successCount > 0) {
            console.log('\n🔄 Restart the backend server to see the new images.');
            console.log('🌾 Your e-pasar now has professional product photos!');
        }
        
        // List all generated images
        if (successCount > 0) {
            console.log('\n📸 New professional images generated:');
            const updatedProducts = await PRODUCTS.findAll({
                where: {
                    ProductImage: {
                        [require('sequelize').Op.like]: 'auto_%'
                    }
                },
                include: [{
                    model: CATEGORY,  
                    as: 'category',
                    attributes: ['CategoryName']
                }]
            });
            
            updatedProducts.forEach(product => {
                console.log(`   • ${product.ProductName} → ${product.ProductImage}`);
            });
        }
        
    } catch (error) {
        console.error('💥 Fatal error during batch image generation:', error);
    }
}

// Run the script
generateImagesForAllProducts();