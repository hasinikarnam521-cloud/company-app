const { Op } = require("sequelize");

const Company = require("../models/Company");
const Job = require("../models/Job");
const User = require("../models/User");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Application = require("../models/Application");



async function createJob(userId, jobData) {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("User account was not found.");
    error.status = 404;
    throw error;
  }

  if (user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Link your recruiter account to a company first.");
    error.status = 403;
    throw error;
  }

  return Job.create({
    company_id: user.company_id,
    title: jobData.title.trim(),
    description: jobData.description.trim(),
    location: jobData.location?.trim() || null,
    job_type: jobData.job_type || "full_time",
    experience_required: jobData.experience_required?.trim() || null,
    salary_range: jobData.salary_range?.trim() || null,
    skills: jobData.skills || [],
    status: "draft",
  });
}

async function listActiveJobs() {
  return Job.findAll({
    where: { status: "active" },
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "location"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

async function listAllJobsForAdmin() {
  const jobs = await Job.findAll({
    include: [
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "location"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  return Promise.all(
    jobs.map(async (job) => ({
      ...job.toJSON(),
      application_count: await Application.count({
        where: { job_id: job.id },
      }),
    }))
  );
}
async function updateJobStatus(userId, jobId, status) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  const job = await Job.findByPk(jobId);

  if (!job) {
    const error = new Error("Job was not found.");
    error.status = 404;
    throw error;
  }

  if (job.company_id !== user.company_id) {
    const error = new Error("You cannot change another company's job.");
    error.status = 403;
    throw error;
  }

  if (status === "active" && job.status !== "active") {
    const now = new Date();

    const subscription = await Subscription.findOne({
      where: {
        company_id: user.company_id,
        status: "active",
        starts_at: { [Op.lte]: now },
        ends_at: { [Op.gt]: now },
      },
      include: [{ model: Plan, as: "plan" }],
    });

    if (!subscription) {
      const error = new Error(
        "An active paid subscription is required to activate a job."
      );
      error.status = 403;
      throw error;
    }

    const jobLimit = subscription.plan.max_active_jobs;

    if (jobLimit !== -1) {
      const activeJobCount = await Job.count({
        where: {
          company_id: user.company_id,
          status: "active",
        },
      });

      if (activeJobCount >= jobLimit) {
        const error = new Error(
          `Your plan allows up to ${jobLimit} active jobs.`
        );
        error.status = 403;
        throw error;
      }
    }
  }

  await job.update({ status });
  return job;
}
async function listCompanyJobs(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  return Job.findAll({
    where: { company_id: user.company_id },
    include: [
      {
        model: Application,
        as: "applications",
        attributes: ["id"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}
async function updateJob(userId, jobId, jobData) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  const job = await Job.findByPk(jobId);

  if (!job) {
    const error = new Error("Job was not found.");
    error.status = 404;
    throw error;
  }

  if (Number(job.company_id) !== Number(user.company_id)) {
    const error = new Error("You cannot edit another company's job.");
    error.status = 403;
    throw error;
  }

  const updates = {};

  if (jobData.title !== undefined) updates.title = jobData.title.trim();
  if (jobData.description !== undefined) {
    updates.description = jobData.description.trim();
  }
  if (jobData.location !== undefined) {
    updates.location = jobData.location.trim() || null;
  }
  if (jobData.job_type !== undefined) updates.job_type = jobData.job_type;
  if (jobData.experience_required !== undefined) {
    updates.experience_required = jobData.experience_required.trim() || null;
  }
  if (jobData.salary_range !== undefined) {
    updates.salary_range = jobData.salary_range.trim() || null;
  }
  if (jobData.skills !== undefined) updates.skills = jobData.skills;

  await job.update(updates);
  return job;
}

module.exports = {
  createJob,
  listActiveJobs,
  listAllJobsForAdmin,
  updateJobStatus,
  listCompanyJobs,
  updateJob,
};