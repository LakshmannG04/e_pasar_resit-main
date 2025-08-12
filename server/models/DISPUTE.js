
module.exports = (sequelize, DataTypes) => {

    const DISPUTE = sequelize.define('DISPUTE', {
        
        DisputeID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        Title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'General Issue'
        },

        Description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        LodgedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        LodgedAgainst: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        
        HandledBy: {
            type: DataTypes.INTEGER,
            allowNull: true, // Can be null initially
        },

        Priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
            allowNull: false,
            defaultValue: 'Medium'
        },

        Status: {
            type: DataTypes.ENUM('Open', 'In Progress', 'Waiting Response', 'Resolved', 'Closed'),
            allowNull: false,
            defaultValue: 'Open'
        },

        IsResolved: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },

        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        ResolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        }

    }, {freezeTableName: true, timestamps: false});



    DISPUTE.associate = function(models) {
        //DISPUTE

        DISPUTE.belongsTo(models.USERS, {
            as: 'Complainant',
            targetKey: 'UserID',
            foreignKey: 'LodgedBy'
        });

        DISPUTE.belongsTo(models.USERS, {
            as: 'Respondent', 
            targetKey: 'UserID',
            foreignKey: 'LodgedAgainst'
        });

        DISPUTE.belongsTo(models.USERS, {
            as: 'Handler',
            targetKey: 'UserID',
            foreignKey: 'HandledBy'
        });

        DISPUTE.hasMany(models.DISPUTE_MSG, {
            sourceKey: 'DisputeID',
            foreignKey: 'DisputeID'
        });
    };


    return DISPUTE;
};