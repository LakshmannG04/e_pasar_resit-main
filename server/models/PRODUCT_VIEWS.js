// PRODUCT_VIEWS model - Track how many times each product is viewed
module.exports = (sequelize, DataTypes) => {

    const PRODUCT_VIEWS = sequelize.define('PRODUCT_VIEWS', {
        
        ViewID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        ProductID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        UserID: {
            type: DataTypes.INTEGER,
            allowNull: true, // Allow anonymous views
        },

        ViewedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        UserAgent: {
            type: DataTypes.STRING,
            allowNull: true, // Browser info for analytics
        }

    }, {freezeTableName: true, timestamps: false});

    PRODUCT_VIEWS.associate = models => {
        
        PRODUCT_VIEWS.belongsTo(models.PRODUCTS, {
            targetKey: 'ProductID',
            foreignKey: 'ProductID'
        });

        PRODUCT_VIEWS.belongsTo(models.USERS, {
            targetKey: 'UserID',
            foreignKey: 'UserID'
        });
    };

    return PRODUCT_VIEWS;
};