const User = require("./userModel");
const Message = require("./chatModel");
const Group = require("./groupModel");
const GroupMember = require("./groupMemberModel");

// --- 1. Private Messaging ---
User.hasMany(Message, { foreignKey: "dbUserId", onDelete: "CASCADE" });
Message.belongsTo(User, { foreignKey: "dbUserId" });

User.hasMany(Message, { foreignKey: "recipientId", as: "receivedMessages" });
Message.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

// --- 2. Group Messaging (Many-to-Many) ---
// We MUST specify the foreignKey and otherKey to match dbUserId and dbGroupId
User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: "dbUserId",
});

Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: "dbGroupId",
});

// --- 3. Message to Group Relationship ---
Group.hasMany(Message, { foreignKey: "groupId" });
Message.belongsTo(Group, { foreignKey: "groupId" });

module.exports = { User, Message, Group, GroupMember };
