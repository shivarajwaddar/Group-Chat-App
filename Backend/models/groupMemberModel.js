const Sequelize = require("sequelize");
const sequelize = require("../utils/db-connection");

const GroupMember = sequelize.define(
  "group_member",
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },

    dbUserId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    dbGroupId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },

    isAdmin: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "group_members",
  },
);

module.exports = GroupMember;
