// Delete specific conversations for seller_test and buyer_test
const { DISPUTE, DISPUTE_MSG, USERS, Sequelize } = require('./models');
const { Op } = Sequelize;

async function deleteUserConversations() {
    try {
        console.log('🗑️ Deleting conversations for specific users...');
        
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
        
        // Find conversations involving seller_test (3 conversations to delete)
        const sellerConversations = await DISPUTE.findAll({
            where: {
                [Op.or]: [
                    { LodgedBy: sellerTest.UserID },
                    { LodgedAgainst: sellerTest.UserID }
                ]
            }
        });
        
        console.log(`📊 Found ${sellerConversations.length} conversations for seller_test`);
        
        // Find conversations involving buyer_test (2 conversations to delete)  
        const buyerConversations = await DISPUTE.findAll({
            where: {
                [Op.or]: [
                    { LodgedBy: buyerTest.UserID },
                    { LodgedAgainst: buyerTest.UserID }
                ]
            }
        });
        
        console.log(`📊 Found ${buyerConversations.length} conversations for buyer_test`);
        
        // Delete messages first (foreign key constraints)
        for (const conv of sellerConversations) {
            await DISPUTE_MSG.destroy({ where: { DisputeID: conv.DisputeID } });
            console.log(`✅ Deleted messages for seller conversation ${conv.DisputeID}`);
        }
        
        for (const conv of buyerConversations) {
            await DISPUTE_MSG.destroy({ where: { DisputeID: conv.DisputeID } });
            console.log(`✅ Deleted messages for buyer conversation ${conv.DisputeID}`);
        }
        
        // Delete conversations
        const sellerDeleteCount = await DISPUTE.destroy({
            where: {
                [Op.or]: [
                    { LodgedBy: sellerTest.UserID },
                    { LodgedAgainst: sellerTest.UserID }
                ]
            }
        });
        
        const buyerDeleteCount = await DISPUTE.destroy({
            where: {
                [Op.or]: [
                    { LodgedBy: buyerTest.UserID },
                    { LodgedAgainst: buyerTest.UserID }
                ]
            }
        });
        
        console.log(`✅ Deleted ${sellerDeleteCount} conversations for seller_test`);
        console.log(`✅ Deleted ${buyerDeleteCount} conversations for buyer_test`);
        console.log('🎉 User conversations cleared successfully!');
        
    } catch (error) {
        console.error('❌ Error deleting user conversations:', error);
    }
    
    process.exit(0);
}

deleteUserConversations();