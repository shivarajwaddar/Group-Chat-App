const { Group, GroupMember, User } = require("../models/associations");

exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    console.log("Creating group:", name, "with members:", members);

    // 1. Create the group record
    const newGroup = await Group.create({
      name: name,
      createdBy: req.user.id,
    });

    // 2. Prepare the list of members to insert into the junction table
    // We use the exact column names from your DB: dbUserId and dbGroupId
    const memberData = [];

    // Add the creator of the group as an Admin
    memberData.push({
      dbGroupId: newGroup.id, // Column name from your screenshot
      dbUserId: req.user.id, // Column name from your screenshot
      isAdmin: true,
    });

    // Add the other selected members
    if (members && members.length > 0) {
      members.forEach((memberId) => {
        memberData.push({
          dbGroupId: newGroup.id,
          dbUserId: memberId,
          isAdmin: false,
        });
      });
    }

    // 3. Insert all members at once (more efficient than a loop)
    await GroupMember.bulkCreate(memberData);

    res.status(201).json({
      success: true,
      message: "Group created successfully!",
      group: newGroup,
    });
  } catch (err) {
    console.error("CREATE GROUP ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserGroups = async (req, res) => {
  try {
    // This finds only groups where the logged-in user is a member
    const groups = await Group.findAll({
      include: [
        {
          model: User,
          where: { id: req.user.id },
          attributes: [], // We only want group data, not user details
          through: { attributes: [] }, // Exclude junction table data from result
        },
      ],
    });

    res.status(200).json({ groups });
  } catch (err) {
    console.error("GET USER GROUPS ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
