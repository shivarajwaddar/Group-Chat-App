const Sequelize = require("sequelize");
const sequelize = require("../utils/db-connection");

const GroupMember = sequelize.define("group_member", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  isAdmin: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = GroupMember;
