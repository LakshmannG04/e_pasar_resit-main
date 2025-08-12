# e_pasar

## Dependencies

### Postgresql Database
(For windows)
- Go to the PostgreSQL downloads page and download the installer: https://www.postgresql.org/download/windows/
- Run the installer

(For mac)
- In the terminal, type 'brew install postgresql@16'
- Then type 'brew services start postgresql@16' to start up the postgresql service


(After installation)
- After downloading postgreSql, the postgresql account credentials should be created as follows:-
    - username: "postgres"
    - password: "abc123"


- Download PgAdmin for GUI to manage the database.
- Create a new database with the following details (tables are not required to be created, code will automatically define them once Backend is running): -
    - database name: "e_pasar"



### Node Package Manager
- (For windows)
- Go to the official Node.js website: https://nodejs.org. Download the LTS (Long-Term Support) version.
- Run the installer — it will install both Node.js and npm.

- (For Mac)
- In the terminal, type 'brew install node'



### Stripe CLI
- (For windows)
- Follow the instructions shown in: https://docs.stripe.com/stripe-cli?install-method=windows

- (For Mac)
- In the terminal, type 'brew install stripe/stripe-cli/stripe'



### After installing the required packages
- Register a stripe account: https://dashboard.stripe.com/register
- In the server/.env file, copy the keys from stripe and replace the variables in the .env as follows: -
STRIPE_SK = replace with Secret key (API key) shown on your Stripe dashboard
STRIPE_PK = replace with Publishable key (API key) shown on your Stripe dashboard
STRIPE_CLIENT_ID = replace with 'test client ID' obtainable by navigating to Settings->Connect->Onboarding options->OAuth tab->copy Test client ID

- In your terminal, change directory into the 'server' folder, type 'npm i', this will install all necessary packages for the libraries
- Repeat the same as above, but change the directory to go into the 'client' folder



## Running the servers
- The project requires 3 separate terminals, one for Backend server, one for Frontend server, one for listening to Stripe events on localhost

(Backend)
- In the terminal, change directory to the 'server' folder
- type 'npm start'


(Frontend)
- In the terminal, change directory to the 'client' folder
- type 'npm run dev'


(Stripe CLI)
- In the terminal, type 'stripe listen --forward-to http://localhost:3001/webhook/stripeWebhook'
- A statement like this will pop up on your terminal 'Ready! You are using Stripe API Version [2024-12-18.acacia]. Your webhook signing secret is whsec_adb89ef0713ae4b3f3663371d737043cc0583fc28412e261bc97493024feccb3'
- Copy the above signing secret and replace the STRIPE_WEBHOOK_SK variable in the .env file (from 'server' folder).


## URL to type in browser
(Buyers and Sellers): localhost:3000
(Admins): localhost:3000/adminDash
