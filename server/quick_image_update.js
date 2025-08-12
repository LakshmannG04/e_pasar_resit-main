#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const { generateProductImage } = require('./functions/imageService');

async function quickImageUpdate() {
    console.log('🚀 Quick image update for key products...');
    
    // Use the API to generate images for various product types
    const productUpdates = [
        { id: 1, name: 'Fresh Organic Tomatoes', category: 'Vegetables' },
        { id: 2, name: 'Sweet Red Apples', category: 'Fruits' },
        { id: 3, name: 'Basil Seeds', category: 'Seeds' },
        { id: 4, name: 'AI Generated Apples', category: 'Fruits' },
        { id: 5, name: 'Fresh Red Apples', category: 'Fruits' },
        { id: 6, name: 'Organic Bananas', category: 'Fruits' },
        { id: 7, name: 'Sweet Oranges', category: 'Fruits' },
        { id: 8, name: 'Fresh Mangoes', category: 'Fruits' },
        { id: 9, name: 'Fresh Strawberries', category: 'Fruits' },
        { id: 10, name: 'Fresh Tomatoes', category: 'Vegetables' }
    ];
    
    for (const product of productUpdates) {
        console.log(`\n📸 [${product.id}] ${product.name} (${product.category})`);
        
        try {
            const result = await generateProductImage(product.name, product.category);
            
            if (result.success) {
                console.log(`✅ Downloaded: ${result.imagePath}`);
                console.log(`📷 By: ${result.imageInfo.photographer}`);
                
                // Update database via API call
                const updateResult = await fetch('http://localhost:8001/products/' + product.id, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ProductImage: result.imagePath
                    })
                }).catch(err => {
                    console.log(`   📝 Note: Manual DB update needed for product ${product.id}`);
                });
                
            } else {
                console.log(`❌ Failed: ${result.error}`);
            }
        } catch (error) {
            console.log(`💥 Error: ${error.message}`);
        }
        
        // Wait 2 seconds between requests to respect API limits
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 Quick update complete! Check /app/server/images/products/ for new images.');
}

quickImageUpdate();