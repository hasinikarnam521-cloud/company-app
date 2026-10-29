const Application = require("../models/Application");
const Interview = require("../models/Interview");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Company = require("../models/Company");
const Job = require("../models/Job");

async function scheduleInterview(userId, applicationId, interviewData) {
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

  return Interview.create({
    application_id: application.id,
    candidate_id: application.candidate_id,
    company_id: application.company_id,
    interviewer: interviewData.interviewer.trim(),
    interview_date: interviewData.interview_date,
    interview_time: interviewData.interview_time,
    mode: interviewData.mode,
    meeting_link: interviewData.meeting_link?.trim() || null,
  });
}
async function listMyInterviews(userId) {
  const candidate = await Candidate.findOne({
    where: { user_id: userId },
  });

  if (!candidate) {
    const error = new Error("Candidate profile was not found.");
    error.status = 404;
    throw error;
  }

  return Interview.findAll({
    where: { candidate_id: candidate.id },
    include: [
      {
        model: Application,
        as: "application",
        include: [
          {
            model: Job,
            as: "job",
            attributes: ["id", "title", "location"],
          },
        ],
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "name", "location"],
      },
    ],
    order: [["interview_date", "ASC"], ["interview_time", "ASC"]],
  });
}
async function listCompanyInterviews(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  return Interview.findAll({
    where: { company_id: user.company_id },
    include: [
      {
        model: Candidate,
        as: "candidate",
        attributes: ["id", "name", "email", "location", "current_role"],
      },
      {
        model: Application,
        as: "application",
        include: [
          {
            model: Job,
            as: "job",
            attributes: ["id", "title", "location"],
          },
        ],
      },
    ],
    order: [
      ["interview_date", "ASC"],
      ["interview_time", "ASC"],
    ],
  });
}
module.exports = {
  scheduleInterview,
  listMyInterviews,
  listCompanyInterviews,
};