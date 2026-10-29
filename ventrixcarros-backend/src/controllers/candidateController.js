const candidateService = require("../services/candidateService");

async function getMyProfile(req, res, next) {
  try {
    const profile = await candidateService.getMyProfile(req.user.id);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
}

async function saveMyProfile(req, res, next) {
  try {
    const profile = await candidateService.saveMyProfile(req.user.id, req.body);

    res.json({
      success: true,
      message: "Candidate profile saved.",
      profile,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMyProfile, saveMyProfile };