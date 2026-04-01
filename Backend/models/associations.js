const User = require("./userModel");
const Message = require("./chatModel");
const Group = require("./groupModel");
const GroupMember = require("./groupMemberModel");
const ArchivedChat = require("./archivedChatModel"); // 1. Import the new model

// --- 1. Private Messaging (Live) ---
User.hasMany(Message, { foreignKey: "dbUserId", onDelete: "CASCADE" });
Message.belongsTo(User, { foreignKey: "dbUserId" });

User.hasMany(Message, { foreignKey: "recipientId", as: "receivedMessages" });
Message.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

// --- 2. Private Messaging (Archived) ---
// We add these so we can still see WHO sent an archived message
User.hasMany(ArchivedChat, { foreignKey: "dbUserId" });
ArchivedChat.belongsTo(User, { foreignKey: "dbUserId" });

// --- 3. Group Messaging (Many-to-Many) ---
User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: "dbUserId",
});

Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: "dbGroupId",
});

// --- 4. Message to Group Relationship (Live) ---
Group.hasMany(Message, { foreignKey: "groupId" });
Message.belongsTo(Group, { foreignKey: "groupId" });

// --- 5. Message to Group Relationship (Archived) ---
// We add this so we can still see WHICH group an archived message belonged to
Group.hasMany(ArchivedChat, { foreignKey: "groupId" });
ArchivedChat.belongsTo(Group, { foreignKey: "groupId" });

// 2. Export the new model
module.exports = { User, Message, Group, GroupMember, ArchivedChat };
