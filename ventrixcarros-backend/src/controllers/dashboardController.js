const dashboardService = require("../services/dashboardService");

async function getRecruiterSummary(req, res, next) {
  try {
    const summary = await dashboardService.getRecruiterSummary(req.user.id);

    res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getRecruiterSummary };