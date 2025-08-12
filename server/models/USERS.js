


module.exports = (sequelize, DataTypes) => {
  const USERS = sequelize.define(
    'USERS',
    {
      UserID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      Username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      Password: {
        type: DataTypes.STRING,
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

      Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      ContactNo: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      UserAuth: {
        type: DataTypes.ENUM('SuperAdmin', 'Admin', 'Seller', 'User'),
        allowNull: false,
      },

      AccountState: {
        type: DataTypes.ENUM('Active', 'Suspended'),
        allowNull: false,
        defaultValue: 'Active',
      },
    },
    {
      freezeTableName: true,
      timestamps: false,
      hooks: {
        afterSync: async () => {
          const bcrypt = require('bcrypt');

          const ensureUser = async ({
            Username,
            PasswordPlain,
            FirstName,
            LastName = null,
            Email,
            ContactNo,
            UserAuth,
          }) => {
            const existing = await USERS.findOne({ where: { Username } });
            if (existing) return existing;

            const hashed = await bcrypt.hash(PasswordPlain, 12);
            return USERS.create({
              Username,
              Password: hashed,
              FirstName,
              LastName,
              Email,
              ContactNo,
              UserAuth,
              AccountState: 'Active',
            });
          };

          // Always ensure SuperAdmin exists
          await ensureUser({
            Username: 'SuperAdmin',
            PasswordPlain: 'Super123',
            FirstName: 'SuperAdmin',
            Email: 'super@gmail.com',
            ContactNo: '0000000000',
            UserAuth: 'SuperAdmin',
          });

          // Demo Admin
          await ensureUser({
            Username: 'admin1',
            PasswordPlain: 'Admin1234',
            FirstName: 'Alice',
            LastName: 'Admin',
            Email: 'admin1@example.com',
            ContactNo: '0111111111',
            UserAuth: 'Admin',
          });

          // Demo Buyer (User)
          await ensureUser({
            Username: 'buyer1',
            PasswordPlain: 'Buyer1234',
            FirstName: 'Bob',
            LastName: 'Buyer',
            Email: 'buyer1@example.com',
            ContactNo: '0222222222',
            UserAuth: 'User',
          });

          // Demo Seller (pre-approved)
          const seller = await ensureUser({
            Username: 'seller1',
            PasswordPlain: 'Seller1234',
            FirstName: 'Sam',
            LastName: 'Seller',
            Email: 'seller1@example.com',
            ContactNo: '0333333333',
            UserAuth: 'Seller',
          });

          // Seed SELLER_INFO for seller1 so it's immediately approved
          try {
            const { SELLER_INFO } = sequelize.models;
            if (SELLER_INFO && seller) {
              const existingSI = await SELLER_INFO.findOne({
                where: { UserID: seller.UserID },
              });
              if (!existingSI) {
                await SELLER_INFO.create({
                  UserID: seller.UserID,
                  ComRegNum: 'SELLER-0001',
                  ComAddress: 'Demo Seller Address',
                  IsVerified: 'Approved',
                });
              } else if (existingSI.IsVerified !== 'Approved') {
                existingSI.IsVerified = 'Approved';
                await existingSI.save();
              }
            }
          } catch (err) {
            // Don’t crash seeding if SELLER_INFO model isn’t ready
            console.log('SELLER_INFO seed skipped:', err?.message || err);
          }
        },
      },
    }
  );

  USERS.associate = (models) => {
    USERS.hasMany(models.CART, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'UserID',
    });

    USERS.hasMany(models.PRODUCTS, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'UserID',
    });

    USERS.hasMany(models.DISPUTE, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'LodgedBy',
    });

    USERS.hasMany(models.DISPUTE, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'LodgedAgainst',
    });

    USERS.hasMany(models.DISPUTE, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'HandledBy',
    });

    USERS.hasMany(models.FEEDBACK, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'UserID',
    });

    USERS.hasMany(models.TRANSACTIONS, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'UserID',
    });

    USERS.hasOne(models.SELLER_INFO, {
      onUpdate: 'RESTRICT',
      onDelete: 'RESTRICT',
      sourceKey: 'UserID',
      foreignKey: 'UserID',
    });
  };

  return USERS;
};
