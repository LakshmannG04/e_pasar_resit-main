// Quick MongoDB Atlas migration - simplified for fast execution
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;

async function quickMigration() {
    console.log('🚀 Starting QUICK migration to MongoDB Atlas...');
    
    const client = new MongoClient(MONGO_URL);
    
    try {
        // Connect
        console.log('🔗 Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('✅ Connected to Atlas!');
        
        const db = client.db('epasar');
        
        // Read and import each JSON file
        const exportDir = './mongodb_export';
        const files = [
            { file: 'users.json', collection: 'users' },
            { file: 'category.json', collection: 'category' },
            { file: 'products.json', collection: 'products' },
            { file: 'product_views.json', collection: 'product_views' },
            { file: 'seller_info.json', collection: 'seller_info' }
        ];
        
        for (const { file, collection } of files) {
            const filePath = path.join(exportDir, file);
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (data.length > 0) {
                    await db.collection(collection).deleteMany({}); // Clear existing
                    const result = await db.collection(collection).insertMany(data);
                    console.log(`✅ Imported ${result.insertedCount} records to ${collection}`);
                } else {
                    console.log(`⏭️  Skipped ${collection} (empty)`);
                }
            }
        }
        
        console.log('🎉 MIGRATION COMPLETE!');
        
        // Test the data
        const productCount = await db.collection('products').countDocuments();
        const userCount = await db.collection('users').countDocuments();
        console.log(`📊 Verification: ${productCount} products, ${userCount} users imported`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
            console.log('\n🔧 SOLUTION: Please add 0.0.0.0/0 to Network Access in MongoDB Atlas');
            console.log('   1. Go to https://cloud.mongodb.com');
            console.log('   2. Click Network Access → Add IP Address');
            console.log('   3. Click "Allow Access from Anywhere"');
            console.log('   4. Run this script again');
        }
    } finally {
        await client.close();
    }
}

quickMigration();