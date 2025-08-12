// Update SQLite database with new image filenames
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SQLITE_DB_PATH = path.join(__dirname, 'database.sqlite');

// Product image mapping
const imageUpdates = [
    { id: 1, filename: "tomatoes_1.jpg" },
    { id: 2, filename: "apples_sweet.jpg" },
    { id: 3, filename: "basil_seeds.jpg" },
    { id: 4, filename: "apples_ai.jpg" },
    { id: 5, filename: "apples_fresh.jpg" },
    { id: 6, filename: "bananas.jpg" },
    { id: 7, filename: "oranges.jpg" },
    { id: 8, filename: "mangoes.jpg" },
    { id: 9, filename: "strawberries.jpg" },
    { id: 10, filename: "tomatoes_2.jpg" },
    { id: 11, filename: "carrots.jpg" },
    { id: 12, filename: "lettuce.jpg" },
    { id: 13, filename: "bell_peppers.jpg" },
    { id: 14, filename: "broccoli.jpg" },
    { id: 15, filename: "spinach.jpg" },
    { id: 16, filename: "sunflower_seeds.jpg" },
    { id: 17, filename: "pumpkin_seeds.jpg" },
    { id: 18, filename: "herb_seeds.jpg" },
    { id: 19, filename: "turmeric.jpg" },
    { id: 20, filename: "black_pepper.jpg" },
    { id: 21, filename: "cinnamon.jpg" }
];

function updateSQLiteImages() {
    const db = new sqlite3.Database(SQLITE_DB_PATH);
    
    console.log('🔄 Updating SQLite database with new image filenames...');
    
    let completed = 0;
    const total = imageUpdates.length;
    
    imageUpdates.forEach(({ id, filename }) => {
        db.run(
            'UPDATE PRODUCTS SET ProductImage = ? WHERE ProductID = ?',
            [filename, id],
            function(err) {
                if (err) {
                    console.error(`❌ Error updating Product ID ${id}:`, err);
                } else {
                    console.log(`✅ Updated Product ID ${id} -> ${filename}`);
                }
                
                completed++;
                if (completed === total) {
                    // Verify updates
                    db.all('SELECT ProductID, ProductName, ProductImage FROM PRODUCTS ORDER BY ProductID', (err, rows) => {
                        if (err) {
                            console.error('❌ Error verifying updates:', err);
                        } else {
                            console.log('\n📋 Verified product images:');
                            rows.forEach(row => {
                                console.log(`  ${row.ProductID}: ${row.ProductName} -> ${row.ProductImage}`);
                            });
                        }
                        
                        db.close();
                        console.log('\n🎉 SQLite database updated successfully!');
                    });
                }
            }
        );
    });
}

updateSQLiteImages();