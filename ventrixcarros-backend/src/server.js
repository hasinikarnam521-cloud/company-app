require("dotenv").config();

const app = require("./app");
const sequelize = require("./config/database");
const User = require("./models/User");
const EmailChangeOtp = require("./models/EmailChangeOtp");
const Company = require("./models/Company");
const Job = require("./models/Job");
const Candidate = require("./models/Candidate");
const Application = require("./models/Application");
const Interview = require("./models/Interview");
const Shortlist = require("./models/Shortlist");
const Plan = require("./models/Plan");
const Subscription = require("./models/Subscription");
const Payment = require("./models/Payment");
const Invoice = require("./models/Invoice");
const LoginOtp = require("./models/LoginOtp");
const Message = require("./models/Message"); 
const SupportTicket = require("./models/SupportTicket");

User.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

Company.hasMany(User, {
  foreignKey: "company_id",
  as: "users",
});
Company.hasMany(Job, {
  foreignKey: "company_id",
  as: "jobs",
});

Job.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
User.hasOne(Candidate, {
  foreignKey: "user_id",
  as: "candidateProfile",
});

Candidate.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});
Job.hasMany(Application, {
  foreignKey: "job_id",
  as: "applications",
});

Application.belongsTo(Job, {
  foreignKey: "job_id",
  as: "job",
});

Candidate.hasMany(Application, {
  foreignKey: "candidate_id",
  as: "applications",
});

Application.belongsTo(Candidate, {
  foreignKey: "candidate_id",
  as: "candidate",
});

Company.hasMany(Application, {
  foreignKey: "company_id",
  as: "applications",
});

Application.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
Application.hasMany(Interview, {
  foreignKey: "application_id",
  as: "interviews",
});

Interview.belongsTo(Application, {
  foreignKey: "application_id",
  as: "application",
});

Candidate.hasMany(Interview, {
  foreignKey: "candidate_id",
  as: "interviews",
});

Interview.belongsTo(Candidate, {
  foreignKey: "candidate_id",
  as: "candidate",
});

Company.hasMany(Interview, {
  foreignKey: "company_id",
  as: "interviews",
});

Interview.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});
Candidate.hasMany(Shortlist, {
  foreignKey: "candidate_id",
  as: "shortlistEntries",
});

Shortlist.belongsTo(Candidate, {
  foreignKey: "candidate_id",
  as: "candidate",
});

Job.hasMany(Shortlist, {
  foreignKey: "job_id",
  as: "shortlistEntries",
});

Shortlist.belongsTo(Job, {
  foreignKey: "job_id",
  as: "job",
});

Company.hasMany(Shortlist, {
  foreignKey: "company_id",
  as: "shortlistEntries",
});

Shortlist.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

User.hasMany(Shortlist, {
  foreignKey: "added_by",
  as: "shortlistAdditions",
});

Shortlist.belongsTo(User, {
  foreignKey: "added_by",
  as: "addedBy",
});
Plan.hasMany(Subscription, {
  foreignKey: "plan_id",
  as: "subscriptions",
});
Subscription.belongsTo(Plan, {
  foreignKey: "plan_id",
  as: "plan",
});

Company.hasMany(Subscription, {
  foreignKey: "company_id",
  as: "subscriptions",
});
Subscription.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

Company.hasMany(Payment, {
  foreignKey: "company_id",
  as: "payments",
});
Payment.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

Subscription.hasMany(Payment, {
  foreignKey: "subscription_id",
  as: "payments",
});
Payment.belongsTo(Subscription, {
  foreignKey: "subscription_id",
  as: "subscription",
});

Company.hasMany(Invoice, {
  foreignKey: "company_id",
  as: "invoices",
});
Invoice.belongsTo(Company, {
  foreignKey: "company_id",
  as: "company",
});

Subscription.hasMany(Invoice, {
  foreignKey: "subscription_id",
  as: "invoices",
});
Invoice.belongsTo(Subscription, {
  foreignKey: "subscription_id",
  as: "subscription",
});

Payment.hasMany(Invoice, {
  foreignKey: "payment_id",
  as: "invoices",
});
Invoice.belongsTo(Payment, {
  foreignKey: "payment_id",
  as: "payment",
});
User.hasMany(LoginOtp, {
  foreignKey: "user_id",
  as: "loginOtps",
});

LoginOtp.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

const port = Number(process.env.PORT || 5000);

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("MySQL connection established.");

    app.listen(port, () => {
      console.log(`API listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to start the API:", error.message);
    process.exit(1);
  }
}

start();