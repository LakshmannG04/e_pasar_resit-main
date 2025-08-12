


module.exports = (sequelize, DataTypes) => {

    const DISPUTE_MSG = sequelize.define('DISPUTE_MSG', {

        MessageID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        
        DisputeID: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        SentBy: {
            type: DataTypes.INTEGER,
            allowNull: false, // User ID who sent the message
        },

        Message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        MessageType: {
            type: DataTypes.ENUM('message', 'system', 'admin_note'),
            allowNull: false,
            defaultValue: 'message'
        },

        MsgDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        IsRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }

    }, {freezeTableName: true, timestamps: false});
    

    DISPUTE_MSG.associate = models => {
        
        DISPUTE_MSG.belongsTo(models.DISPUTE, {
            targetKey: 'DisputeID',
            foreignKey: 'DisputeID'
        });

        DISPUTE_MSG.belongsTo(models.USERS, {
            targetKey: 'UserID',
            foreignKey: 'SentBy'
        });

    };


    return DISPUTE_MSG;
};