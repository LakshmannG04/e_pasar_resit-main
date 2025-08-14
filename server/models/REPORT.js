module.exports = (sequelize, DataTypes) => {
    const REPORT = sequelize.define('REPORT', {
        
        ReportID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        ReportedConversationID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'DISPUTE',
                key: 'DisputeID'
            }
        },

        ReportedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'USERS',
                key: 'UserID'
            }
        },

        AssignedAdminID: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'USERS',
                key: 'UserID'
            }
        },

        AdminConversationID: {
            type: DataTypes.INTEGER,
            allowNull: true, // Will be set after creating admin conversation
            references: {
                model: 'DISPUTE',
                key: 'DisputeID'
            }
        },

        ReportTitle: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Conversation Report'
        },

        ReportDescription: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        ReportAttachments: {
            type: DataTypes.TEXT, // JSON string of attachment file paths
            allowNull: true
        },

        Priority: {
            type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
            allowNull: false,
            defaultValue: 'Medium'
        },

        Status: {
            type: DataTypes.ENUM('Pending', 'Under Review', 'Resolved', 'Closed'),
            allowNull: false,
            defaultValue: 'Pending'
        },

        CreatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },

        ResolvedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }

    }, {
        freezeTableName: true, 
        timestamps: false
    });

    REPORT.associate = function(models) {
        // Report belongs to the conversation being reported
        REPORT.belongsTo(models.DISPUTE, {
            as: 'ReportedConversation',
            targetKey: 'DisputeID',
            foreignKey: 'ReportedConversationID'
        });

        // Report belongs to the user who reported
        REPORT.belongsTo(models.USERS, {
            as: 'Reporter',
            targetKey: 'UserID',
            foreignKey: 'ReportedBy'
        });

        // Report belongs to the assigned admin
        REPORT.belongsTo(models.USERS, {
            as: 'AssignedAdmin',
            targetKey: 'UserID',
            foreignKey: 'AssignedAdminID'
        });

        // Report has an admin conversation
        REPORT.belongsTo(models.DISPUTE, {
            as: 'AdminConversation',
            targetKey: 'DisputeID',
            foreignKey: 'AdminConversationID'
        });
    };

    return REPORT;
};