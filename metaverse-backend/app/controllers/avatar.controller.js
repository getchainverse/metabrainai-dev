const db = require("../models");
const Avatar = db.avatar;

exports.getMyAvatar = async (req, res) => {
  try {
    const avatar = await Avatar.findOne({
      where: { userId: req.userId },
    });

    if (!avatar) {
      // Return default configuration if none exists
      return res.status(200).send({
        presetName: "Default Custom",
        bodySettings: {},
        faceSettings: {},
        hairSettings: {},
        clothing: {},
        colors: {},
        equippedItems: {},
      });
    }

    return res.status(200).send(avatar);
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

exports.saveMyAvatar = async (req, res) => {
  try {
    const {
      presetName,
      bodySettings,
      faceSettings,
      hairSettings,
      clothing,
      colors,
      equippedItems,
    } = req.body;

    let avatar = await Avatar.findOne({
      where: { userId: req.userId },
    });

    if (avatar) {
      // Update existing
      avatar = await avatar.update({
        presetName,
        bodySettings,
        faceSettings,
        hairSettings,
        clothing,
        colors,
        equippedItems,
      });
    } else {
      // Create new
      avatar = await Avatar.create({
        userId: req.userId,
        presetName,
        bodySettings,
        faceSettings,
        hairSettings,
        clothing,
        colors,
        equippedItems,
      });
    }

    return res.status(200).send({
      message: "Avatar saved successfully!",
      avatar,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};
