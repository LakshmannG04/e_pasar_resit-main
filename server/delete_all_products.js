// Script to delete all products from the SQLite database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

// Main function to delete all products
async function deleteAllProducts() {
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🗑️  Deleting all products from database...');
        
        // Delete all products
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM PRODUCTS', function(err) {
                if (err) reject(err);
                else {
                    console.log(`✅ Successfully deleted ${this.changes} products`);
                    resolve();
                }
            });
        });
        
        // Verify deletion
        await new Promise((resolve, reject) => {
            db.all('SELECT COUNT(*) as count FROM PRODUCTS', (err, rows) => {
                if (err) reject(err);
                else {
                    console.log(`📊 Products remaining: ${rows[0].count}`);
                    resolve();
                }
            });
        });
        
        console.log('🎉 All products have been successfully deleted!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

// Run the deletion
deleteAllProducts();