


module.exports = (sequelize, DataTypes) => {

    const SELLER_INFO = sequelize.define('SELLER_INFO', {

        
        UserID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
        },

        ComRegNum: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        ComAddress: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        IsVerified: {
            type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
            allowNull: false,
            defaultValue: 'Pending',
        },


    }, {freezeTableName: true, timestamps: false});
    

    SELLER_INFO.associate = models => {
        
        SELLER_INFO.belongsTo(models.USERS, {
            targetKey: 'UserID',
            foreignKey: 'UserID'
        });

    };


    return SELLER_INFO;
};