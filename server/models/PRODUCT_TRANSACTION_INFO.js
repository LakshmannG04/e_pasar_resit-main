


module.exports = (sequelize, DataTypes) => {

    const PRODUCT_TRANSACTION_INFO = sequelize.define('PRODUCT_TRANSACTION_INFO', {

        
        TransactionID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },

        ProductID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
        },

        Quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            min: 1,
        },

        SoldPrice: {
            type: DataTypes.REAL,
            allowNull: false,
            min: 0,
        },

        PaymentClaimStatus: {
            type: DataTypes.ENUM('INVALID', 'PENDING', 'UNCLAIMED', 'CLAIMED'),
            allowNull: false,
            defaultValue: 'PENDING',
        }


    }, {freezeTableName: true, timestamps: false});


    
    PRODUCT_TRANSACTION_INFO.associate = models => {

        PRODUCT_TRANSACTION_INFO.belongsTo(models.TRANSACTIONS, {
            targetKey: 'TransactionID',
            foreignKey: 'TransactionID'
        });

        PRODUCT_TRANSACTION_INFO.belongsTo(models.PRODUCTS, {
            targetKey: 'ProductID',
            foreignKey: 'ProductID'
        });

    };


    return PRODUCT_TRANSACTION_INFO;
};