// server/index.js - Main Server File
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');


const port = process.env.PORT;
const frontend_port = process.env.FRONTEND_PORT;
const frontend_ip = process.env.FRONTEND_IP;
const server_ip = process.env.BACKEND_IP;

const db = require('./models');


// Import scheduled tasks
require('./functions/scheduled_tasks/scheduledTasks');


// Import Routes
const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');
const productRoute = require('./routes/products');
const adminRoute = require('./routes/admin');
const cartRoute = require('./routes/cart');
const checkoutRoute = require('./routes/checkout');
const categoryRoute = require('./routes/category');
const ordersRoute = require('./routes/orders');
const webhookRoute = require('./routes/webhook');
const profileRoute = require('./routes/profile');
const promoRoute = require('./routes/promo');
const communicationRoute = require('./routes/communication');

// Middleware to parse incoming JSON requests
app.use(express.json({
  verify: function(req, res, buf) {
      req.rawBody = buf;
  }
}));

// Configure CORS to allow requests from the frontend (localhost:3000)
app.use(cors({
  origin: `http://${frontend_ip}:${frontend_port}`, // Only allow requests from the frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  credentials: true // Enable credentials to be passed along (optional)
}));

// Use imported route middlewares
app.use('/signup', signupRoute);
app.use('/login', loginRoute);
app.use('/products', productRoute);
app.use('/admin', adminRoute);
app.use('/cart', cartRoute);
app.use('/checkout', checkoutRoute);
app.use('/category', categoryRoute);
app.use('/orders', ordersRoute);
app.use('/webhook', webhookRoute);
app.use('/profile', profileRoute);
app.use('/promo', promoRoute);
app.use('/communication', communicationRoute);


// Handle unknown routes
app.use((req, res) => {
  res.status(404).send('Endpoint not found');
});



// Start the server with error handling
db.sequelize.sync().then(() => {

  app.listen(port, server_ip, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
    } else {
      console.log(`Server running on http://${server_ip}:${port}`);
    }
  });

});

