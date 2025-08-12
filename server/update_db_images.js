#!/usr/bin/env node

const { PRODUCTS } = require('./models');

async function updateProductImages() {
    console.log('🔄 Updating product image extensions from .jpg to .svg...');
    
    try {
        // Get all products with their current image names
        const products = await PRODUCTS.findAll();
        
        console.log(`📦 Found ${products.length} products to update`);
        
        // Update each product's image extension
        for (const product of products) {
            if (product.ProductImage && product.ProductImage.endsWith('.jpg')) {
                const newImageName = product.ProductImage.replace('.jpg', '.svg');
                
                await PRODUCTS.update(
                    { ProductImage: newImageName },
                    { where: { ProductID: product.ProductID } }
                );
                
                console.log(`✅ Updated Product ${product.ProductID}: ${product.ProductImage} → ${newImageName}`);
            }
        }
        
        console.log('\n🎉 All product images updated successfully!');
        console.log('🔄 Restart the backend server to see the new images.');
        
    } catch (error) {
        console.error('❌ Error updating product images:', error);
    }
}

updateProductImages();