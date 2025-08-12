
module.exports = (sequelize, DataTypes) => {

    const PRODUCTS = sequelize.define('PRODUCTS', {
        
        ProductID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        UserID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: 'user_product_unique',
        },
        
        ProductName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: 'user_product_unique',
        },

        PromoActive:{
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        PromoEndDate:{
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        Price: {
            type: DataTypes.REAL,
            allowNull: false,
            min: 0,
        },

        DiscPrice: {
            type: DataTypes.REAL,
            allowNull: true,
            min: 0,
        },

        MOQ: {
            type: DataTypes.INTEGER,
            allowNull: false,
            min: 1,
            defaultValue: 1,
        },

        AvailableQty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            min: 0,
            defaultValue: 0,
        },

        ProductImage: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        Description: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'No Description',
        },

        ProdStatus: {
            type: DataTypes.ENUM('Active', 'Inactive', 'Suspended'),
            allowNull: false,
            defaultValue: 'Active',
        },

        CategoryID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },


    }, {indexes: [{unique: true, fields:['UserID','ProductName']}], freezeTableName: true, timestamps: false});


    PRODUCTS.associate = models => {
        
        //PRODUCTS
        PRODUCTS.hasMany(models.CART, {
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            sourceKey: 'ProductID',
            foreignKey: 'ProductID'
        });

        PRODUCTS.belongsTo(models.USERS, {
            targetKey: 'UserID',
            foreignKey: 'UserID'
        });

        PRODUCTS.belongsTo(models.CATEGORY, {
            targetKey: 'CategoryID',
            foreignKey: 'CategoryID'
        });

        PRODUCTS.hasMany(models.FEEDBACK, {
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            sourceKey: 'ProductID',
            foreignKey: 'ProductID'
        });

        PRODUCTS.hasMany(models.PRODUCT_TRANSACTION_INFO, {
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            sourceKey: 'ProductID',
            foreignKey: 'ProductID'
        });
    };


    return PRODUCTS;
};