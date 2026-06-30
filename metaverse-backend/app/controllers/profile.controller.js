const profileService = require("../services/profile.service");

exports.getProfile = async (req, res) => {
  try {
    const profile = await profileService.getOrCreateProfile(req.userId);
    return res.status(200).send({ profile });
  } catch (error) {
    return res.status(error.statusCode || 500).send({
      message: error.message || "Unable to load profile.",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const profile = await profileService.updateProfile(req.userId, req.body);
    return res.status(200).send({ profile });
  } catch (error) {
    return res.status(error.statusCode || 500).send({
      message: error.message || "Unable to update profile.",
      errors: error.errors,
    });
  }
};

exports.getAvatarCustomization = async (req, res) => {
  try {
    const customization = await profileService.getOrCreateCustomization(req.userId);
    return res.status(200).send({ customization });
  } catch (error) {
    return res.status(error.statusCode || 500).send({
      message: error.message || "Unable to load avatar customization.",
    });
  }
};

exports.updateAvatarCustomization = async (req, res) => {
  try {
    const customization = await profileService.updateCustomization(req.userId, req.body);
    return res.status(200).send({ customization });
  } catch (error) {
    return res.status(error.statusCode || 500).send({
      message: error.message || "Unable to update avatar customization.",
      errors: error.errors,
    });
  }
};
