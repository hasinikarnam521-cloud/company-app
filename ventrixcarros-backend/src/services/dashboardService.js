const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const Shortlist = require("../models/Shortlist");
const Interview = require("../models/Interview");

async function getRecruiterSummary(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("User account was not found.");
    error.status = 404;
    throw error;
  }

  if (user.role !== "recruiter" || !user.company_id) {
    const error = new Error("A recruiter account linked to a company is required.");
    error.status = 403;
    throw error;
  }

  const companyId = user.company_id;

  const [activeJobs, applications, shortlisted, interviews, recentApplications] =
    await Promise.all([
      Job.count({
        where: {
          company_id: companyId,
          status: "active",
        },
      }),

      Application.count({
        where: { company_id: companyId },
      }),

      Shortlist.count({
        where: { company_id: companyId },
      }),

      Interview.count({
        where: {
          company_id: companyId,
          status: "scheduled",
        },
      }),

      Application.findAll({
        where: { company_id: companyId },
        attributes: ["id", "status", "ai_score", "created_at"],
        include: [
          {
            model: Candidate,
            as: "candidate",
            attributes: ["id", "name", "experience", "current_role"],
          },
          {
            model: Job,
            as: "job",
            attributes: ["id", "title"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: 4,
      }),
    ]);

  return {
    stats: {
      activeJobs,
      applications,
      shortlisted,
      interviews,
    },
    recentCandidates: recentApplications.map((application) => ({
      applicationId: application.id,
      candidateId: application.candidate?.id ?? null,
      name: application.candidate?.name ?? "Candidate",
      experience: application.candidate?.experience ?? "",
      currentRole: application.candidate?.current_role ?? "",
      jobTitle: application.job?.title ?? "Job",
      aiScore:
        application.ai_score === null || application.ai_score === undefined
          ? null
          : Number(application.ai_score),
      status: application.status,
      appliedAt: application.created_at,
    })),
  };
}

module.exports = { getRecruiterSummary };