
module.exports = (sequelize, DataTypes) => {

    const FEEDBACK = sequelize.define('FEEDBACK', {
        
        FeedbackID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        UserID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        
        ProductID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        FeedbackMsg: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'empty',
        },



    }, {freezeTableName: true, timestamps: false});


    FEEDBACK.associate = models => {
        
        //FEEDBACK

        FEEDBACK.belongsTo(models.USERS, {
            targetKey: 'UserID',
            foreignKey: 'UserID'
        });

        FEEDBACK.belongsTo(models.PRODUCTS, {
            targetKey: 'ProductID',
            foreignKey: 'ProductID'
        });
    };


    return FEEDBACK;
};