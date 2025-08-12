// Script to replace current products with 8 real products using user-provided images
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;
const imagesDir = path.join(__dirname, 'images/products');

// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// New product data with user-provided images (8 products - 2 per category)
const newProducts = [
    // FRUITS (CategoryID: 1)
    {
        id: 1,
        name: "Fresh Red Apples",
        price: 4.99,
        moq: 1,
        availableQty: 100,
        description: "Crisp and juicy red apples, perfect for snacking or baking. Rich in fiber, vitamin C, and antioxidants. These premium apples are locally sourced and hand-picked for optimal freshness and flavor.",
        categoryId: 1,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/uqkibkwh_image.png",
        filename: "apple_fresh.jpg"
    },
    {
        id: 2,
        name: "Sweet Valencia Oranges",
        price: 5.49,
        moq: 2,
        availableQty: 80,
        description: "Sweet and juicy Valencia oranges bursting with vitamin C and natural goodness. Perfect for fresh juice, snacking, or adding zest to your recipes. These sun-ripened oranges offer the perfect balance of sweetness and tang.",
        categoryId: 1,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/n2h804ei_image.png",
        filename: "orange_valencia.jpg"
    },
    
    // VEGETABLES (CategoryID: 2)
    {
        id: 3,
        name: "Organic Baby Carrots",
        price: 3.79,
        moq: 1,
        availableQty: 120,
        description: "Fresh, crunchy organic baby carrots packed with beta-carotene and vitamins. Perfect for snacking, cooking, or juicing. These carrots are grown without pesticides and harvested at peak freshness for maximum nutritional value.",
        categoryId: 2,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/hwn8ocai_image.png",
        filename: "carrot_organic.jpg"
    },
    {
        id: 4,
        name: "Fresh Baby Spinach",
        price: 4.25,
        moq: 1,
        availableQty: 90,
        description: "Tender, nutrient-rich baby spinach leaves perfect for salads, smoothies, and cooking. Packed with iron, vitamins A, C, and K. These delicate leaves are carefully washed and ready to eat straight from the package.",
        categoryId: 2,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/fqo8o2rf_image.png",
        filename: "spinach_baby.jpg"
    },
    
    // SEEDS (CategoryID: 3)
    {
        id: 5,
        name: "Premium Sunflower Seeds",
        price: 6.99,
        moq: 1,
        availableQty: 75,
        description: "High-quality sunflower seeds perfect for snacking, baking, or growing. Rich in healthy fats, protein, and vitamin E. These seeds are carefully selected and roasted to perfection for a delicious, nutritious treat.",
        categoryId: 3,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/tefimizs_image.png",
        filename: "sunflower_seeds.jpg"
    },
    {
        id: 6,
        name: "Organic Chia Seeds",
        price: 8.99,
        moq: 1,
        availableQty: 60,
        description: "Nutrient-dense organic chia seeds, a superfood packed with omega-3 fatty acids, fiber, and protein. Perfect for smoothies, puddings, and healthy recipes. These tiny seeds expand when soaked and provide sustained energy.",
        categoryId: 3,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/6j9zwzwa_image.png",
        filename: "chia_seeds.jpg"
    },
    
    // SPICES (CategoryID: 4)
    {
        id: 7,
        name: "Ceylon Cinnamon Sticks",
        price: 12.99,
        moq: 1,
        availableQty: 45,
        description: "Premium Ceylon cinnamon sticks with a sweet, delicate flavor perfect for baking, cooking, and tea. Known as 'true cinnamon', Ceylon variety is milder and more aromatic than cassia. Hand-selected for quality and freshness.",
        categoryId: 4,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/6xj4mn2w_image.png",
        filename: "cinnamon_ceylon.jpg"
    },
    {
        id: 8,
        name: "Golden Turmeric Powder",
        price: 9.75,
        moq: 1,
        availableQty: 85,
        description: "Pure, organic turmeric powder with vibrant golden color and earthy aroma. Contains curcumin with powerful anti-inflammatory properties. Perfect for curries, golden milk, and health-conscious recipes. Freshly ground from premium turmeric roots.",
        categoryId: 4,
        userID: 3,
        imageUrl: "https://customer-assets.emergentagent.com/job_shop-reality/artifacts/ugf6a1tg_image.png",
        filename: "turmeric_golden.jpg"
    }
];

// Download image from URL
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        
        protocol.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadImage(response.headers.location, filepath);
            }
            
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

// Main function to replace products
async function replaceProducts() {
    const client = new MongoClient(MONGO_URL);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('epasar');
        const collection = db.collection('products');
        
        // Step 1: Clear existing products
        console.log('🗑️  Clearing existing products...');
        await collection.deleteMany({});
        console.log('✅ Existing products cleared');
        
        // Step 2: Download images and create new products
        console.log('📥 Downloading images and creating new products...');
        
        for (const product of newProducts) {
            try {
                console.log(`📥 Processing: ${product.name}`);
                
                // Download image
                const filepath = path.join(imagesDir, product.filename);
                await downloadImage(product.imageUrl, filepath);
                console.log(`✅ Downloaded: ${product.filename}`);
                
                // Create product in database
                await collection.insertOne({
                    ProductID: product.id,
                    UserID: product.userID,
                    ProductName: product.name,
                    Price: product.price,
                    MOQ: product.moq,
                    AvailableQty: product.availableQty,
                    ProductImage: product.filename,
                    Description: product.description,
                    CategoryID: product.categoryId,
                    ProdStatus: 'Active',
                    PromoActive: 0,
                    DiscPrice: null
                });
                
                console.log(`✅ Created product: ${product.name}`);
                
            } catch (error) {
                console.error(`❌ Failed to process ${product.name}: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Successfully replaced all products with real images!');
        
        // Verify the updates
        const products = await collection.find({}, { ProductName: 1, ProductImage: 1, Price: 1 }).toArray();
        console.log('\n📋 New product list:');
        products.forEach(p => {
            console.log(`  - ${p.ProductName}: ${p.ProductImage} (RM ${p.Price})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

// Run the replacement
replaceProducts();