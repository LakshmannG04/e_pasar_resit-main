const uuid = require('uuid'); // Used to generate mockup tracking ID

//mockup function, does not require parameters
async function createDeliveryOrder() {
    return uuid.v4();
}

//mockup function, does not require parameters
async function getDeliveryFee() {
    return 5.00;
}


module.exports = { createDeliveryOrder, getDeliveryFee };