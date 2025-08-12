require('dotenv').config();
const cron = require('node-cron');
const { promoValidation } = require('./subtasks/checkPromo');
const { handleTransactionTimeout } = require('./subtasks/transactionTimeout');


//first star is for seconds, then minutes, hours, day of month, month, day of week
// validate promo validity every day at midnight
cron.schedule('0 0 0 * * *', async () => {
    //this runs every day at midnight
    await promoValidation();
});




// handle transaction timeouts
cron.schedule(`0 */${process.env.TRANSACTION_TTL} * * * *`, async () => {
    //this runs based on the transaction timeout set in the .env file
    await handleTransactionTimeout();
});
