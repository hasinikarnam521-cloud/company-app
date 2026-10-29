const interviewService = require("../services/interviewService");

async function scheduleInterview(req, res, next) {
  try {
    const interview = await interviewService.scheduleInterview(
      req.user.id,
      Number(req.params.applicationId),
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Interview scheduled.",
      interview,
    });
  } catch (error) {
    next(error);
  }
}
async function listMyInterviews(req, res, next) {
  try {
    const interviews = await interviewService.listMyInterviews(req.user.id);

    res.json({
      success: true,
      interviews,
    });
  } catch (error) {
    next(error);
  }
}
async function listCompanyInterviews(req, res, next) {
  try {
    const interviews = await interviewService.listCompanyInterviews(req.user.id);

    res.json({
      success: true,
      interviews,
    });
  } catch (error) {
    next(error);
  }
}
module.exports = {
  scheduleInterview,
  listMyInterviews,
  listCompanyInterviews,
};