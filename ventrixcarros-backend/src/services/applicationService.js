const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const User = require("../models/User");
const Company = require("../models/Company");

async function applyToJob(userId, jobId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "candidate") {
    const error = new Error("Candidate account was not found.");
    error.status = 404;
    throw error;
  }

  const candidate = await Candidate.findOne({
    where: { user_id: userId },
  });

  if (!candidate) {
    const error = new Error("Create your candidate profile before applying.");
    error.status = 400;
    throw error;
  }

  const job = await Job.findByPk(jobId);

  if (!job || job.status !== "active") {
    const error = new Error("This job is not available for applications.");
    error.status = 404;
    throw error;
  }

  const existingApplication = await Application.findOne({
    where: {
      job_id: job.id,
      candidate_id: candidate.id,
    },
  });

  if (existingApplication) {
    const error = new Error("You have already applied to this job.");
    error.status = 409;
    throw error;
  }

  return Application.create({
    job_id: job.id,
    candidate_id: candidate.id,
    company_id: job.company_id,
    status: "submitted",
  });
}
async function listCompanyApplications(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  return Application.findAll({
    where: { company_id: user.company_id },
    include: [
      {
        model: Candidate,
        as: "candidate",
        attributes: ["id", "name", "email", "phone", "location", "skills"],
      },
      {
        model: Job,
        as: "job",
        attributes: ["id", "title", "status"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}
async function updateApplicationStatus(userId, applicationId, status, notes) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  const application = await Application.findOne({
    where: {
      id: applicationId,
      company_id: user.company_id,
    },
  });

  if (!application) {
    const error = new Error("Application was not found for your company.");
    error.status = 404;
    throw error;
  }

  await application.update({
    status,
    ...(notes !== undefined ? { notes: notes.trim() || null } : {}),
  });

  return application;
}
async function listMyApplications(userId) {
  const candidate = await Candidate.findOne({
    where: { user_id: userId },
  });

  if (!candidate) {
    const error = new Error("Create your candidate profile before viewing applications.");
    error.status = 404;
    throw error;
  }

  return Application.findAll({
    where: { candidate_id: candidate.id },
    include: [
      {
        model: Job,
        as: "job",
        attributes: ["id", "title", "location", "status"],
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "location"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}
module.exports = {
  applyToJob,
  listCompanyApplications,
  updateApplicationStatus,
  listMyApplications,
};