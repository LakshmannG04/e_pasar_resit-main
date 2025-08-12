
# MongoDB Import Instructions

Your SQLite data has been exported to JSON files. Here's how to import them to MongoDB Atlas:

## Option 1: Using MongoDB Compass (GUI)
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to your Atlas cluster using the connection string
3. Create database "epasar"
4. For each JSON file, create a collection and import the data

## Option 2: Using mongoimport (Command line)
```bash
# Example for products collection
mongoimport --uri "mongodb+srv://Lakshmann:Awesomegame1@cluster0.7ywiutl.mongodb.net/epasar" --collection products --file products.json --jsonArray

# Repeat for each collection:
# users.json -> users collection
# category.json -> category collection  
# products.json -> products collection
# etc.
```

## Option 3: Manual MongoDB Queries
Copy the content from each JSON file and use insertMany() in MongoDB shell.

## Files exported:
- users.json (7 records)
- category.json (4 records)
- products.json (22 records)
- cart.json (0 records)
- delivery_details.json (0 records)
- dispute.json (0 records)
- dispute_msg.json (0 records)
- feedback.json (0 records)
- payment.json (0 records)
- transactions.json (0 records)
- product_transaction_info.json (0 records)
- product_views.json (214 records)
- seller_info.json (1 records)

Total: 248 records across 13 collections
