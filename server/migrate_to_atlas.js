// Migration script to export SQLite data and import to MongoDB Atlas
const sqlite3 = require('sqlite3').verbose();
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL;
const SQLITE_DB_PATH = './database.sqlite';

// MongoDB connection options with SSL fix
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true
};

// Export data from SQLite
async function exportFromSQLite() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(SQLITE_DB_PATH);
        const data = {};

        // List of tables to export
        const tables = [
            'USERS', 'CATEGORY', 'PRODUCTS', 'CART', 'DELIVERY_DETAILS',
            'DISPUTE', 'DISPUTE_MSG', 'FEEDBACK', 'PAYMENT', 'TRANSACTIONS',
            'PRODUCT_TRANSACTION_INFO', 'PRODUCT_VIEWS', 'SELLER_INFO'
        ];

        let completed = 0;

        tables.forEach(table => {
            db.all(`SELECT * FROM ${table}`, (err, rows) => {
                if (err) {
                    console.error(`Error reading table ${table}:`, err);
                    reject(err);
                    return;
                }
                
                data[table.toLowerCase()] = rows;
                console.log(`✅ Exported ${rows.length} records from ${table}`);
                
                completed++;
                if (completed === tables.length) {
                    db.close();
                    resolve(data);
                }
            });
        });
    });
}

// Import data to MongoDB Atlas
async function importToMongoDB(data) {
    const client = new MongoClient(MONGO_URL, mongoOptions);
    
    try {
        console.log('🔗 Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        
        const db = client.db('epasar');
        
        // Import each collection
        for (const [collectionName, records] of Object.entries(data)) {
            if (records.length > 0) {
                const collection = db.collection(collectionName);
                
                // Clear existing data (optional - remove if you want to append)
                await collection.deleteMany({});
                
                // Insert records
                const result = await collection.insertMany(records);
                console.log(`✅ Imported ${result.insertedCount} records to ${collectionName}`);
            }
        }
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    } finally {
        await client.close();
    }
}

// Test MongoDB connection
async function testConnection() {
    const client = new MongoClient(MONGO_URL, mongoOptions);
    
    try {
        console.log('🧪 Testing MongoDB Atlas connection...');
        console.log('Connection URL:', MONGO_URL.replace(/:[^:]+@/, ':***@')); // Hide password
        
        await client.connect();
        console.log('✅ Connection test successful!');
        
        // List databases to verify connection
        const adminDb = client.db().admin();
        const result = await adminDb.listDatabases();
        console.log('📁 Available databases:', result.databases.map(db => db.name));
        
        return true;
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    } finally {
        await client.close();
    }
}

// Main migration function
async function migrate() {
    try {
        console.log('🚀 Starting migration from SQLite to MongoDB Atlas...');
        
        // Test connection first
        const connectionOk = await testConnection();
        if (!connectionOk) {
            console.log('❌ Cannot proceed with migration due to connection issues');
            return;
        }
        
        // Export from SQLite
        console.log('\n📤 Exporting data from SQLite...');
        const data = await exportFromSQLite();
        
        // Import to MongoDB
        console.log('\n📥 Importing data to MongoDB Atlas...');
        await importToMongoDB(data);
        
        console.log('\n✅ Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update NODE_ENV to production (or update config to use MongoDB in development)');
        console.log('2. Restart your backend server');
        console.log('3. Test the application');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    // Check if we should just test connection
    if (process.argv.includes('--test')) {
        testConnection();
    } else {
        migrate();
    }
}

module.exports = { migrate, exportFromSQLite, importToMongoDB, testConnection };