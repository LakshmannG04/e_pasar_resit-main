require('dotenv').config();
const stripe = require('stripe')(`${process.env.STRIPE_SK}`);
const gateway = stripe;

async function createCheckoutSession(amount, transaction_id, successUrl, cancelUrl) {
  
  amount = amount * 100; // Convert to cents
  amount = Math.round(amount);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'myr',
          product_data: {
            name: 'e-pasar purchase',
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: {
      transaction_id: transaction_id,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;

}


async function retrieveCheckoutSession(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}


async function cancelCheckoutSession(sessionId) {
  
  try {
    const session = await stripe.checkout.sessions.expire(sessionId);
    return session;
  } catch (err) {
    console.error('Error expiring session:', err);
    return 1;
  }
}


module.exports = { gateway, createCheckoutSession, retrieveCheckoutSession, cancelCheckoutSession };