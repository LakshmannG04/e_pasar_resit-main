

module.exports = (sequelize, DataTypes) => {


    const CATEGORY = sequelize.define('CATEGORY', {
        
        
        CategoryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        CategoryName: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },

        CategoryImage: {
            type: DataTypes.STRING,
            allowNull: false,
        },

    }, {freezeTableName: true,
        timestamps: false,
        hooks: {
                    afterSync: async () => {
                        const count = await CATEGORY.count();
                        if (count === 0) {
                            await CATEGORY.bulkCreate([
                                {CategoryName: 'Fruits', CategoryImage: '1.jpg'},
                                {CategoryName: 'Vegetables', CategoryImage: '2.jpg'},
                                {CategoryName: 'Seeds', CategoryImage: '3.jpg'},
                                {CategoryName: 'Spices', CategoryImage: '4.jpg'},
                            ]);
                        }
                    }
                }

        });


    CATEGORY.associate = models => {
         //CATEGORY
        CATEGORY.hasMany(models.PRODUCTS, {
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            sourceKey: 'CategoryID',
            foreignKey: 'CategoryID'
        });
    };


    return CATEGORY;
};