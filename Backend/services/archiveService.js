const { Op } = require("sequelize");
const sequelize = require("../utils/db-connection"); // Adjust path to your db connection

// IMPORTANT: Use the exact names exported in your associations.js
const { Message, ArchivedChat } = require("../models/associations");

exports.archiveOldMessages = async () => {
  const transaction = await sequelize.transaction();
  try {
    // Set to 1 minute for testing purposes
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    // Now 'Message' will be defined because we imported it above
    const oldMessages = await Message.findAll({
      where: {
        createdAt: { [Op.lt]: oneMinuteAgo },
      },
      transaction,
    });

    if (oldMessages.length > 0) {
      const messagesToArchive = oldMessages.map((msg) => msg.dataValues);

      await ArchivedChat.bulkCreate(messagesToArchive, { transaction });

      await Message.destroy({
        where: { createdAt: { [Op.lt]: oneMinuteAgo } },
        transaction,
      });
      console.log(`SUCCESS: Archived ${oldMessages.length} messages.`);
    } else {
      console.log("CRON: No messages older than 1 minute found.");
    }

    await transaction.commit();
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Archiving failed:", error);
  }
};
