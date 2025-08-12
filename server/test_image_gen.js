#!/usr/bin/env node

const { generateProductImage } = require('./functions/imageService');

async function testImageGeneration() {
    console.log('🧪 Testing image generation for a few products...');
    
    const testProducts = [
        { name: 'Fresh Organic Tomatoes', category: 'Vegetables' },
        { name: 'Sweet Red Apples', category: 'Fruits' },
        { name: 'Organic Bananas', category: 'Fruits' }
    ];
    
    for (const product of testProducts) {
        console.log(`\n📸 Testing: ${product.name} (${product.category})`);
        
        try {
            const result = await generateProductImage(product.name, product.category);
            
            if (result.success) {
                console.log(`✅ SUCCESS: ${result.imagePath}`);
                console.log(`📷 Photographer: ${result.imageInfo.photographer}`);
            } else {
                console.log(`❌ FAILED: ${result.error}`);
            }
        } catch (error) {
            console.log(`💥 ERROR: ${error.message}`);
        }
        
        // Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testImageGeneration();