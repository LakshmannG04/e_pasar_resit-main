const { PRODUCTS } = require('../../../models');

async function promoValidation(){
    
    try{
        const products = await PRODUCTS.findAll({ where: { PromoActive: true } });

        if (products.length === 0) {
            console.log('No products with active promos found');
            return;
        }
        

        for (const product of products) {
            if(product.PromoEndDate >= new Date().toISOString().split('T')[0]) {
                product.PromoActive = false;
                product.DiscPrice = null;
                product.PromoEndDate = null;
                await product.save();
                console.log(`Promo for product ${product.ProductID} has ended and has been deactivated.`);
            }
        }

        console.log('Promo validation completed successfully');
        return;

        

    } catch (err) {
        console.error('Scheduled task error for promo validation:', err);
    }
    


}

module.exports = { promoValidation };