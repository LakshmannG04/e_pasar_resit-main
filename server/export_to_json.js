// Export SQLite data to JSON files for manual import
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

const SQLITE_DB_PATH = './database.sqlite';
const EXPORT_DIR = './mongodb_export';

async function exportToJSON() {
    try {
        // Create export directory
        await fs.mkdir(EXPORT_DIR, { recursive: true });
        console.log(`📁 Created export directory: ${EXPORT_DIR}`);

        const db = new sqlite3.Database(SQLITE_DB_PATH);
        
        // List of tables to export
        const tables = [
            'USERS', 'CATEGORY', 'PRODUCTS', 'CART', 'DELIVERY_DETAILS',
            'DISPUTE', 'DISPUTE_MSG', 'FEEDBACK', 'PAYMENT', 'TRANSACTIONS',
            'PRODUCT_TRANSACTION_INFO', 'PRODUCT_VIEWS', 'SELLER_INFO'
        ];

        const exportPromises = tables.map(table => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM ${table}`, async (err, rows) => {
                    if (err) {
                        console.error(`❌ Error reading table ${table}:`, err);
                        reject(err);
                        return;
                    }

                    try {
                        const filename = path.join(EXPORT_DIR, `${table.toLowerCase()}.json`);
                        await fs.writeFile(filename, JSON.stringify(rows, null, 2));
                        console.log(`✅ Exported ${rows.length} records from ${table} to ${filename}`);
                        resolve({ table, count: rows.length });
                    } catch (writeErr) {
                        reject(writeErr);
                    }
                });
            });
        });

        const results = await Promise.all(exportPromises);
        db.close();

        // Create summary
        const summary = {
            exportDate: new Date().toISOString(),
            totalTables: results.length,
            tables: results.reduce((acc, result) => {
                acc[result.table.toLowerCase()] = result.count;
                return acc;
            }, {}),
            totalRecords: results.reduce((sum, result) => sum + result.count, 0)
        };

        await fs.writeFile(
            path.join(EXPORT_DIR, 'export_summary.json'),
            JSON.stringify(summary, null, 2)
        );

        console.log('\n🎉 Export completed successfully!');
        console.log(`📊 Summary: ${summary.totalTables} tables, ${summary.totalRecords} total records`);
        console.log(`📁 Files saved in: ${EXPORT_DIR}/`);
        
        // Create import instructions
        const instructions = `
# MongoDB Import Instructions

Your SQLite data has been exported to JSON files. Here's how to import them to MongoDB Atlas:

## Option 1: Using MongoDB Compass (GUI)
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to your Atlas cluster using the connection string
3. Create database "epasar"
4. For each JSON file, create a collection and import the data

## Option 2: Using mongoimport (Command line)
\`\`\`bash
# Example for products collection
mongoimport --uri "mongodb+srv://Lakshmann:Awesomegame1@cluster0.7ywiutl.mongodb.net/epasar" --collection products --file products.json --jsonArray

# Repeat for each collection:
# users.json -> users collection
# category.json -> category collection  
# products.json -> products collection
# etc.
\`\`\`

## Option 3: Manual MongoDB Queries
Copy the content from each JSON file and use insertMany() in MongoDB shell.

## Files exported:
${results.map(r => `- ${r.table.toLowerCase()}.json (${r.count} records)`).join('\n')}

Total: ${summary.totalRecords} records across ${summary.totalTables} collections
`;

        await fs.writeFile(path.join(EXPORT_DIR, 'IMPORT_INSTRUCTIONS.md'), instructions);
        console.log('📋 Import instructions saved to IMPORT_INSTRUCTIONS.md');

    } catch (error) {
        console.error('❌ Export failed:', error);
    }
}

// Run export
exportToJSON();