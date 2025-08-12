


module.exports = (sequelize, DataTypes) => {

    const CART = sequelize.define('CART', {

        
        UserID: {
            type: DataTypes.INTEGER,
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
        },


    }, {freezeTableName: true, timestamps: false});
    

    CART.associate = models => {
        //CART
        CART.belongsTo(models.USERS, {
            targetKey: 'UserID',
            foreignKey: 'UserID'
        });

        CART.belongsTo(models.PRODUCTS, {
            targetKey: 'ProductID',
            foreignKey: 'ProductID'
        });
    };


    return CART;
};