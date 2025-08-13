// Script to create a test product to verify seller information functionality
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

async function createTestProduct() {
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('📦 Creating test product with seller info...');
        
        // Create a test product with seller_test as the seller
        const testProduct = {
            ProductID: 1,
            UserID: 3, // seller_test user ID
            ProductName: "Test Mango",
            PromoActive: 0,
            PromoEndDate: null,
            Price: 5.99,
            DiscPrice: null,
            MOQ: 1,
            AvailableQty: 50,
            ProductImage: "test_mango.jpg",
            Description: "Fresh test mango for testing seller information display. Sweet and juicy!",
            ProdStatus: "Active",
            CategoryID: 1 // Fruits category
        };
        
        await new Promise((resolve, reject) => {
            const sql = `INSERT INTO PRODUCTS 
                (ProductID, UserID, ProductName, PromoActive, PromoEndDate, Price, DiscPrice, MOQ, AvailableQty, ProductImage, Description, ProdStatus, CategoryID) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [
                testProduct.ProductID,
                testProduct.UserID,
                testProduct.ProductName,
                testProduct.PromoActive,
                testProduct.PromoEndDate,
                testProduct.Price,
                testProduct.DiscPrice,
                testProduct.MOQ,
                testProduct.AvailableQty,
                testProduct.ProductImage,
                testProduct.Description,
                testProduct.ProdStatus,
                testProduct.CategoryID
            ], function(err) {
                if (err) reject(err);
                else {
                    console.log(`✅ Created test product: ${testProduct.ProductName}`);
                    resolve();
                }
            });
        });
        
        // Verify the product was created
        await new Promise((resolve, reject) => {
            db.all('SELECT p.ProductID, p.ProductName, p.UserID, u.Username, u.FirstName, u.LastName FROM PRODUCTS p LEFT JOIN USERS u ON p.UserID = u.UserID WHERE p.ProductID = ?', [1], (err, rows) => {
                if (err) reject(err);
                else {
                    if (rows.length > 0) {
                        const product = rows[0];
                        console.log(`\n📋 Product created successfully:`);
                        console.log(`  - Product: ${product.ProductName}`);
                        console.log(`  - Product ID: ${product.ProductID}`);
                        console.log(`  - Seller User ID: ${product.UserID}`);
                        console.log(`  - Seller Username: ${product.Username}`);
                        console.log(`  - Seller Name: ${product.FirstName} ${product.LastName}`);
                    }
                    resolve();
                }
            });
        });
        
        console.log('\n🎉 Test product created successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

createTestProduct();