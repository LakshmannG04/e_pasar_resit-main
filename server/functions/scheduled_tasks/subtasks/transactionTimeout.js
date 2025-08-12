
const { TRANSACTIONS, PRODUCT_TRANSACTION_INFO, PRODUCTS } = require('../../../models');


async function handleTransactionTimeout(){
    
    const transactionTTL = parseInt(process.env.TRANSACTION_TTL);

    const transactions = await TRANSACTIONS.findAll({ where: { TransactionState: 'PENDING', PaymentID:null } });

    for(const transaction of transactions){
        
        const transactionExpiryTime = new Date(transaction.CreatedAt);
        transactionExpiryTime.setMinutes(transactionExpiryTime.getMinutes() + transactionTTL);
        
        // if transaction has expired
        // should be able to put this in a separate function (similar to invalidateTransactionItems in checkout.js)
        if (transactionExpiryTime < new Date()) {
            transaction.TransactionState = 'FAILED';
            await transaction.save();

            const transactionItems = await PRODUCT_TRANSACTION_INFO.findAll({ where: { TransactionID: transaction.TransactionID } });

            for (const item of transactionItems) {
                item.PaymentClaimStatus = 'INVALID';
                await item.save();

                const productEntry = await PRODUCTS.findByPk(item.ProductID);
                productEntry.AvailableQty += item.Quantity;
                await productEntry.save();
            }

        }

    }

    console.log('Transaction timeout check complete');
}


module.exports = { handleTransactionTimeout };