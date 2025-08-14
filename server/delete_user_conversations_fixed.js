// Delete specific conversations for seller_test and buyer_test - FIXED VERSION
const { DISPUTE, DISPUTE_MSG, USERS, REPORT, Sequelize } = require('./models');
const { Op } = Sequelize;

async function deleteUserConversations() {
    try {
        console.log('🗑️ Deleting conversations for specific users (FIXED VERSION)...');
        
        // Get user IDs
        const sellerTest = await USERS.findOne({ where: { Username: 'seller_test' } });
        const buyerTest = await USERS.findOne({ where: { Username: 'buyer_test' } });
        
        if (!sellerTest) {
            console.log('❌ seller_test user not found');
            return;
        }
        
        if (!buyerTest) {
            console.log('❌ buyer_test user not found');
            return;
        }
        
        console.log(`🔍 Found seller_test: ID ${sellerTest.UserID}`);
        console.log(`🔍 Found buyer_test: ID ${buyerTest.UserID}`);
        
        // Find conversations involving seller_test
        const sellerConversations = await DISPUTE.findAll({
            where: {
                [Op.or]: [
                    { LodgedBy: sellerTest.UserID },
                    { LodgedAgainst: sellerTest.UserID }
                ]
            }
        });
        
        console.log(`📊 Found ${sellerConversations.length} conversations for seller_test`);
        
        // Find conversations involving buyer_test
        const buyerConversations = await DISPUTE.findAll({
            where: {
                [Op.or]: [
                    { LodgedBy: buyerTest.UserID },
                    { LodgedAgainst: buyerTest.UserID }
                ]
            }
        });
        
        console.log(`📊 Found ${buyerConversations.length} conversations for buyer_test`);
        
        // Collect all conversation IDs
        const allConversationIds = [
            ...sellerConversations.map(c => c.DisputeID),
            ...buyerConversations.map(c => c.DisputeID)
        ];
        
        // Remove duplicates (in case there are conversations between seller_test and buyer_test)
        const uniqueConversationIds = [...new Set(allConversationIds)];
        console.log(`📊 Total unique conversations to delete: ${uniqueConversationIds.length}`);
        
        // STEP 1: Delete REPORTS that reference these conversations
        console.log('\n🗑️ Step 1: Deleting related reports...');
        
        // Delete reports where ReportedConversationID is in our list
        const reportDeleteCount1 = await REPORT.destroy({
            where: {
                ReportedConversationID: {
                    [Op.in]: uniqueConversationIds
                }
            }
        });
        console.log(`✅ Deleted ${reportDeleteCount1} reports referencing these conversations`);
        
        // Delete reports where AdminConversationID is in our list
        const reportDeleteCount2 = await REPORT.destroy({
            where: {
                AdminConversationID: {
                    [Op.in]: uniqueConversationIds
                }
            }
        });
        console.log(`✅ Deleted ${reportDeleteCount2} reports with admin conversations in our list`);
        
        // STEP 2: Delete DISPUTE_MSG (messages) for these conversations
        console.log('\n🗑️ Step 2: Deleting messages...');
        const messageDeleteCount = await DISPUTE_MSG.destroy({
            where: {
                DisputeID: {
                    [Op.in]: uniqueConversationIds
                }
            }
        });
        console.log(`✅ Deleted ${messageDeleteCount} messages from these conversations`);
        
        // STEP 3: Delete DISPUTE (conversations) for seller_test
        console.log('\n🗑️ Step 3: Deleting seller_test conversations...');
        const sellerDeleteCount = await DISPUTE.destroy({
            where: {
                [Op.or]: [
                    { LodgedBy: sellerTest.UserID },
                    { LodgedAgainst: sellerTest.UserID }
                ]
            }
        });
        console.log(`✅ Deleted ${sellerDeleteCount} conversations for seller_test`);
        
        // STEP 4: Delete DISPUTE (conversations) for buyer_test
        console.log('\n🗑️ Step 4: Deleting buyer_test conversations...');
        const buyerDeleteCount = await DISPUTE.destroy({
            where: {
                [Op.or]: [
                    { LodgedBy: buyerTest.UserID },
                    { LodgedAgainst: buyerTest.UserID }
                ]
            }
        });
        console.log(`✅ Deleted ${buyerDeleteCount} conversations for buyer_test`);
        
        // Summary
        console.log('\n🎉 DELETION SUMMARY:');
        console.log(`📊 Reports deleted: ${reportDeleteCount1 + reportDeleteCount2}`);
        console.log(`📊 Messages deleted: ${messageDeleteCount}`);
        console.log(`📊 seller_test conversations deleted: ${sellerDeleteCount}`);
        console.log(`📊 buyer_test conversations deleted: ${buyerDeleteCount}`);
        console.log(`📊 Total conversations deleted: ${sellerDeleteCount + buyerDeleteCount}`);
        console.log('✅ User conversations cleared successfully!');
        
    } catch (error) {
        console.error('❌ Error deleting user conversations:', error);
    }
    
    process.exit(0);
}

deleteUserConversations();