const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Shortlist = require("../models/Shortlist");
const User = require("../models/User");

async function addToShortlist(userId, jobId, candidateId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  const job = await Job.findOne({
    where: { id: jobId, company_id: user.company_id },
  });

  if (!job) {
    const error = new Error("Job was not found for your company.");
    error.status = 404;
    throw error;
  }

  const candidate = await Candidate.findByPk(candidateId);

  if (!candidate) {
    const error = new Error("Candidate was not found.");
    error.status = 404;
    throw error;
  }

  const existing = await Shortlist.findOne({
    where: {
      candidate_id: candidate.id,
      job_id: job.id,
      company_id: user.company_id,
    },
  });

  if (existing) {
    const error = new Error("This candidate is already shortlisted for this job.");
    error.status = 409;
    throw error;
  }

  return Shortlist.create({
    candidate_id: candidate.id,
    job_id: job.id,
    company_id: user.company_id,
    added_by: user.id,
  });
}

async function listShortlist(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  return Shortlist.findAll({
    where: { company_id: user.company_id },
    include: [
      { model: Candidate, as: "candidate", attributes: ["id", "name", "email", "skills"] },
      { model: Job, as: "job", attributes: ["id", "title", "status"] },
    ],
    order: [["created_at", "DESC"]],
  });
}

module.exports = { addToShortlist, listShortlist };