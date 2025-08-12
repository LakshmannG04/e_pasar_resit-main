
module.exports = (sequelize, DataTypes) => {

    const DELIVERY_DETAILS = sequelize.define('DELIVERY_DETAILS', {
        
        DeliveryID: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },

        TrackingNo: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        DeliveryFee: {
            type: DataTypes.REAL,
            allowNull: false,
            min: 0,
        },

        DeliveryStatus: {
            type: DataTypes.ENUM('Processing', 'Dropped off for shipping', 'In transit', 'Delivered'),
            allowNull: false,
        },

        FirstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        
        LastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        ContactNo: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        Address: {
            type: DataTypes.STRING,
            allowNull: false,
        },



    }, {freezeTableName: true, timestamps: false});


    DELIVERY_DETAILS.associate = models => {
    
        //DELIVERY_DETAILS

        DELIVERY_DETAILS.hasMany(models.TRANSACTIONS, {
            onUpdate: 'RESTRICT',
            onDelete: 'RESTRICT',
            sourceKey: 'DeliveryID',
            foreignKey: 'DeliveryID'
        });

    };


    return DELIVERY_DETAILS;
};