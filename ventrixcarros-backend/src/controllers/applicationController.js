const applicationService = require("../services/applicationService");

async function applyToJob(req, res, next) {
  try {
    const application = await applicationService.applyToJob(
      req.user.id,
      Number(req.params.jobId)
    );

    res.status(201).json({
      success: true,
      message: "Application submitted.",
      application,
    });
  } catch (error) {
    next(error);
  }
}
async function listCompanyApplications(req, res, next) {
  try {
    const applications = await applicationService.listCompanyApplications(req.user.id);

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
}
async function updateApplicationStatus(req, res, next) {
  try {
    const application = await applicationService.updateApplicationStatus(
      req.user.id,
      Number(req.params.applicationId),
      req.body.status,
      req.body.notes
    );

    res.json({
      success: true,
      message: "Application updated.",
      application,
    });
  } catch (error) {
    next(error);
  }
}
async function listMyApplications(req, res, next) {
  try {
    const applications = await applicationService.listMyApplications(req.user.id);

    res.json({
      success: true,
      applications,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  applyToJob,
  listCompanyApplications,
  updateApplicationStatus,
  listMyApplications,
};