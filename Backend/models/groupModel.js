const Sequelize = require("sequelize");
const sequelize = require("../utils/db-connection");

const Group = sequelize.define("db_groups", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  createdBy: {
    type: Sequelize.INTEGER, // Stores the User ID of the admin
    allowNull: false,
  },
});

module.exports = Group;
