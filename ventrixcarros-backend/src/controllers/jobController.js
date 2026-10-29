const jobService = require("../services/jobService");

async function createJob(req, res, next) {
  try {
    const job = await jobService.createJob(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: "Job created as a draft.",
      job,
    });
  } catch (error) {
    next(error);
  }
}

async function listActiveJobs(req, res, next) {
  try {
    const jobs = await jobService.listActiveJobs();

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
}
async function listAllJobsForAdmin(req, res, next) {
  try {
    const jobs = await jobService.listAllJobsForAdmin();

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    next(error);
  }
}
async function updateJobStatus(req, res, next) {
  try {
    const job = await jobService.updateJobStatus(
      req.user.id,
      Number(req.params.jobId),
      req.body.status
    );

    res.json({
      success: true,
      message: "Job status updated.",
      job,
    });
  } catch (error) {
    next(error);
  }
}
async function listCompanyJobs(req, res, next) {
  try {
    const jobs = await jobService.listCompanyJobs(req.user.id);
    res.json({ success: true, jobs });
  } catch (error) {
    next(error);
  }
}
async function updateJob(req, res, next) {
  try {
    const job = await jobService.updateJob(
      req.user.id,
      Number(req.params.jobId),
      req.body
    );

    res.json({
      success: true,
      message: "Job updated.",
      job,
    });
  } catch (error) {
    next(error);
  }
}
module.exports = {
  createJob,
  listActiveJobs,
  listAllJobsForAdmin,
  updateJobStatus,
  listCompanyJobs,
  updateJob,
};