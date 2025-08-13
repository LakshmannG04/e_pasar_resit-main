// Script to check users in the database
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

async function checkUsers() {
    const db = new sqlite3.Database(dbPath);
    
    try {
        console.log('🔍 Checking users in database...');
        
        // Check all users
        await new Promise((resolve, reject) => {
            db.all('SELECT UserID, Username, FirstName, LastName, UserAuth, Email FROM USERS', (err, rows) => {
                if (err) reject(err);
                else {
                    console.log(`📊 Total users: ${rows.length}`);
                    console.log('\n👥 User list:');
                    rows.forEach(user => {
                        console.log(`  - ${user.Username} (${user.FirstName} ${user.LastName}) - ${user.UserAuth} - ${user.Email}`);
                    });
                    resolve(rows);
                }
            });
        });
        
        // Check buyer_test specifically
        await new Promise((resolve, reject) => {
            db.all('SELECT * FROM USERS WHERE Username = ?', ['buyer_test'], (err, rows) => {
                if (err) reject(err);
                else {
                    if (rows.length > 0) {
                        console.log('\n🔍 buyer_test user details:');
                        console.log(rows[0]);
                    } else {
                        console.log('\n❌ buyer_test user not found');
                    }
                    resolve(rows);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

checkUsers();