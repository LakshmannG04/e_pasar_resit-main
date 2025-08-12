require('dotenv').config();

module.exports = {
    development: {
        use_env_variable: 'MONGO_URL',
        dialect: "mongodb"
    },
    test: {
        dialect: "sqlite", 
        storage: "./database.sqlite"
    },
    production: {
        use_env_variable: 'MONGO_URL',
        dialect: "mongodb"
    }
  };