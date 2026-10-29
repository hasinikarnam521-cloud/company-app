const profileService = require("../services/profileService");

async function updateName(req, res, next) {
  try {
    const user = await profileService.updateName(req.user.id, req.body.name);

    res.json({
      success: true,
      message: "Name updated.",
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function requestEmailChange(req, res, next) {
  try {
    const result = await profileService.requestEmailChange(
      req.user.id,
      req.body.email
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmailChange(req, res, next) {
  try {
    const user = await profileService.verifyEmailChange(
      req.user.id,
      req.body.email,
      req.body.code
    );

    res.json({
      success: true,
      message: "Email address updated.",
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateName,
  requestEmailChange,
  verifyEmailChange,
};