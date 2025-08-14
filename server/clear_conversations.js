// Clear all conversations script
const { DISPUTE, DISPUTE_MSG, REPORT } = require('./models');

async function clearAllConversations() {
    try {
        console.log('🗑️ Clearing all conversations...');
        
        // Delete in correct order to avoid foreign key constraints
        await DISPUTE_MSG.destroy({ where: {} });
        console.log('✅ Deleted all messages');
        
        await REPORT.destroy({ where: {} });
        console.log('✅ Deleted all reports');
        
        await DISPUTE.destroy({ where: {} });
        console.log('✅ Deleted all conversations');
        
        console.log('🎉 All conversations cleared successfully!');
        
    } catch (error) {
        console.error('❌ Error clearing conversations:', error);
    }
    
    process.exit(0);
}

clearAllConversations();