// Script to download real product images and update database
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;
const imagesDir = path.join(__dirname, 'images');

// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Product images mapping - matching each product with appropriate images
const productImageMapping = [
    // Fruits
    { id: 1, name: "Fresh Organic Tomatoes", url: "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "tomatoes_1.jpg" },
    { id: 2, name: "Sweet Red Apples", url: "https://images.unsplash.com/photo-1707734534246-b456bdb7db6c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "apples_sweet.jpg" },
    { id: 4, name: "AI Generated Apples", url: "https://images.unsplash.com/photo-1707734534246-b456bdb7db6c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "apples_ai.jpg" },
    { id: 5, name: "Fresh Red Apples", url: "https://images.unsplash.com/photo-1707734534246-b456bdb7db6c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "apples_fresh.jpg" },
    { id: 6, name: "Organic Bananas", url: "https://images.pexels.com/photos/868110/pexels-photo-868110.jpeg", filename: "bananas.jpg" },
    { id: 7, name: "Sweet Oranges", url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "oranges.jpg" },
    { id: 8, name: "Fresh Mangoes", url: "https://images.pexels.com/photos/1691180/pexels-photo-1691180.jpeg", filename: "mangoes.jpg" },
    { id: 9, name: "Strawberries", url: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHx2ZWdldGFibGVzfGVufDB8fHx8MTc1NDU1MDY4NXww&ixlib=rb-4.1.0&q=85", filename: "strawberries.jpg" },
    
    // Vegetables
    { id: 10, name: "Fresh Tomatoes", url: "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "tomatoes_2.jpg" },
    { id: 11, name: "Organic Carrots", url: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "carrots.jpg" },
    { id: 12, name: "Green Lettuce", url: "https://images.unsplash.com/photo-1551772413-6c1b7dc18548?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njh8MHwxfHNlYXJjaHw0fHxoZXJic3xlbnwwfHx8fDE3NTQ1NTA3MjV8MA&ixlib=rb-4.1.0&q=85", filename: "lettuce.jpg" },
    { id: 13, name: "Bell Peppers Mix", url: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwzfHxmcmVzaCUyMHByb2R1Y2V8ZW58MHx8fHwxNzU0NTUwNjgwfDA&ixlib=rb-4.1.0&q=85", filename: "bell_peppers.jpg" },
    { id: 14, name: "Fresh Broccoli", url: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHx2ZWdldGFibGVzfGVufDB8fHx8MTc1NDU1MDY4NXww&ixlib=rb-4.1.0&q=85", filename: "broccoli.jpg" },
    { id: 15, name: "Organic Spinach", url: "https://images.unsplash.com/photo-1551772413-6c1b7dc18548?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njh8MHwxfHNlYXJjaHw0fHxoZXJic3xlbnwwfHx8fDE3NTQ1NTA3MjV8MA&ixlib=rb-4.1.0&q=85", filename: "spinach.jpg" },
    
    // Seeds
    { id: 3, name: "Organic Basil Seeds", url: "https://images.unsplash.com/photo-1533792344354-ed5e8fc12494?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njh8MHwxfHNlYXJjaHwyfHxoZXJic3xlbnwwfHx8fDE3NTQ1NTA3MjV8MA&ixlib=rb-4.1.0&q=85", filename: "basil_seeds.jpg" },
    { id: 16, name: "Sunflower Seeds", url: "https://images.unsplash.com/photo-1508748169069-82590c9f26e6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njh8MHwxfHNlYXJjaHwxfHxzZWVkc3xlbnwwfHx8fDE3NTQ1NTA3MDl8MA&ixlib=rb-4.1.0&q=85", filename: "sunflower_seeds.jpg" },
    { id: 17, name: "Pumpkin Seeds", url: "https://images.pexels.com/photos/971078/pexels-photo-971078.jpeg", filename: "pumpkin_seeds.jpg" },
    { id: 18, name: "Herb Seed Mix", url: "https://images.pexels.com/photos/401213/pexels-photo-401213.jpeg", filename: "herb_seeds.jpg" },
    
    // Spices
    { id: 19, name: "Organic Turmeric Powder", url: "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njh8MHwxfHNlYXJjaHwxfHxzcGljZXN8ZW58MHx8fHwxNzU0NTUwNjk0fDA&ixlib=rb-4.1.0&q=85", filename: "turmeric.jpg" },
    { id: 20, name: "Black Pepper Whole", url: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njh8MHwxfHNlYXJjaHwyfHxzcGljZXN8ZW58MHx8fHwxNzU0NTUwNjk0fDA&ixlib=rb-4.1.0&q=85", filename: "black_pepper.jpg" },
    { id: 21, name: "Cinnamon Sticks", url: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njh8MHwxfHNlYXJjaHwzfHxzcGljZXN8ZW58MHx8fHwxNzU0NTUwNjk0fDA&ixlib=rb-4.1.0&q=85", filename: "cinnamon.jpg" },
    
    // Test product - keep existing
    { id: 22, name: "AI Generated Product Test", url: null, filename: "default.jpg" }
];

// Download image from URL
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }
            
            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });
            
            fileStream.on('error', reject);
        }).on('error', reject);
    });
}

// Convert image to base64
function imageToBase64(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            const base64 = data.toString('base64');
            resolve(base64);
        });
    });
}

// Update database with new image paths
async function updateProductImages() {
    const client = new MongoClient(MONGO_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        
        const db = client.db('epasar');
        const collection = db.collection('products');
        
        let updated = 0;
        
        for (const product of productImageMapping) {
            if (product.url) {
                try {
                    console.log(`📥 Downloading image for ${product.name}...`);
                    const filepath = path.join(imagesDir, product.filename);
                    
                    await downloadImage(product.url, filepath);
                    console.log(`✅ Downloaded: ${product.filename}`);
                    
                    // Update database with new image filename
                    await collection.updateOne(
                        { ProductID: product.id },
                        { $set: { ProductImage: product.filename } }
                    );
                    
                    updated++;
                    console.log(`✅ Updated database for Product ID ${product.id}`);
                    
                } catch (error) {
                    console.error(`❌ Failed to process ${product.name}: ${error.message}`);
                }
            }
        }
        
        console.log(`\n🎉 Successfully updated ${updated} product images!`);
        
        // Verify the updates
        const products = await collection.find({}, { ProductName: 1, ProductImage: 1 }).toArray();
        console.log('\n📋 Updated product images:');
        products.forEach(p => {
            console.log(`  - ${p.ProductName}: ${p.ProductImage}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

// Run the update
updateProductImages();