const User = require("../models/User");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Candidate = require("../models/Candidate");
const Application = require("../models/Application");
const Interview = require("../models/Interview");
const Shortlist = require("../models/Shortlist");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");

async function exportAccountData(userId) {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password_hash"] },
  });

  if (!user) {
    const error = new Error("User account was not found.");
    error.status = 404;
    throw error;
  }

  const exportedData = {
    exported_at: new Date().toISOString(),
    account: user.toJSON(),
  };

  // Non-company accounts only export their own account details.
  if (!user.company_id) {
    return exportedData;
  }

  const companyId = user.company_id;

  const [
    company,
    companyUsers,
    jobs,
    applications,
    interviews,
    shortlist,
    subscriptions,
    payments,
    invoices,
  ] = await Promise.all([
    Company.findByPk(companyId),
    User.findAll({
      where: { company_id: companyId },
      attributes: { exclude: ["password_hash"] },
    }),
    Job.findAll({ where: { company_id: companyId } }),
    Application.findAll({ where: { company_id: companyId } }),
    Interview.findAll({ where: { company_id: companyId } }),
    Shortlist.findAll({ where: { company_id: companyId } }),
    Subscription.findAll({ where: { company_id: companyId } }),
    Payment.findAll({ where: { company_id: companyId } }),
    Invoice.findAll({ where: { company_id: companyId } }),
  ]);

  const candidateIds = [...new Set(applications.map((item) => item.candidate_id))];
  const planIds = [...new Set(subscriptions.map((item) => item.plan_id))];

  const [candidates, plans] = await Promise.all([
    candidateIds.length
      ? Candidate.findAll({ where: { id: candidateIds } })
      : [],
    planIds.length ? Plan.findAll({ where: { id: planIds } }) : [],
  ]);

  exportedData.company = company ? company.toJSON() : null;
  exportedData.company_users = companyUsers.map((item) => item.toJSON());
  exportedData.jobs = jobs.map((item) => item.toJSON());
  exportedData.applications = applications.map((item) => item.toJSON());
  exportedData.candidates = candidates.map((item) => item.toJSON());
  exportedData.interviews = interviews.map((item) => item.toJSON());
  exportedData.shortlists = shortlist.map((item) => item.toJSON());
  exportedData.subscriptions = subscriptions.map((item) => item.toJSON());
  exportedData.plans = plans.map((item) => item.toJSON());
  exportedData.payments = payments.map((item) => item.toJSON());
  exportedData.invoices = invoices.map((item) => item.toJSON());

  return exportedData;
}

module.exports = { exportAccountData };