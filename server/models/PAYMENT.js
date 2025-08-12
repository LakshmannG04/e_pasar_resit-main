
module.exports = (sequelize, DataTypes) => {

    const PAYMENT = sequelize.define('PAYMENT', {
        
        PaymentID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false
        },

        PaymentType: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        CardType: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        CardLast4Digits: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        
        Amount: {
            type: DataTypes.REAL,
            allowNull: false,
        },

        PaymentDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },



    }, {freezeTableName: true, timestamps: false});


    PAYMENT.associate = models => {
        
        //PAYMENT

        PAYMENT.hasMany(models.TRANSACTIONS, {
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            sourceKey: 'PaymentID',
            foreignKey: 'PaymentID'
        });
    };


    return PAYMENT;
};