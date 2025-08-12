


module.exports = (sequelize, DataTypes) => {

    const TRANSACTIONS = sequelize.define('TRANSACTIONS', {

        
        TransactionID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },

        TransactionState: {
            type: DataTypes.ENUM('PENDING', 'APPROVED', 'FAILED', 'PAID BUT COLLIDED'),
            allowNull: false,
        },

        UserID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },


        PaymentID: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        DeliveryID: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        }


    }, {freezeTableName: true, timestamps: false});


    
    TRANSACTIONS.associate = models => {
    
        TRANSACTIONS.hasMany(models.PRODUCT_TRANSACTION_INFO, {
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            sourceKey: 'TransactionID',
            foreignKey: 'TransactionID'
        });


        TRANSACTIONS.belongsTo(models.USERS, {
            targetKey: 'UserID',
            foreignKey: 'UserID'
        });

        TRANSACTIONS.belongsTo(models.PAYMENT, {
            targetKey: 'PaymentID',
            foreignKey: 'PaymentID'
        });

        TRANSACTIONS.belongsTo(models.DELIVERY_DETAILS, {
            targetKey: 'DeliveryID',
            foreignKey: 'DeliveryID'
        });

        

    };


    return TRANSACTIONS;
};