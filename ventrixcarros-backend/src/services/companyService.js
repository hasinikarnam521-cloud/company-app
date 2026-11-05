const sequelize = require("../config/database");
const Company = require("../models/Company");
const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const CompanyInvitation = require("../models/CompanyInvitation");
const emailService = require("./emailService");

async function createCompany(userId, companyData) {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      const error = new Error("User account was not found.");
      error.status = 404;
      throw error;
    }

    if (user.company_id) {
      const error = new Error("This user is already linked to a company.");
      error.status = 409;
      throw error;
    }

    const existingCompany = await Company.findOne({
      where: { email: companyData.email.trim().toLowerCase() },
      transaction,
    });

    if (existingCompany) {
      const error = new Error("A company with this email already exists.");
      error.status = 409;
      throw error;
    }

    const company = await Company.create(
      {
        name: companyData.name.trim(),
        email: companyData.email.trim().toLowerCase(),
        location: companyData.location?.trim() || null,
        website: companyData.website?.trim() || null,
        industry: companyData.industry?.trim() || null,
        company_size: companyData.company_size?.trim() || null,
      },
      { transaction }
    );

    await user.update({ company_id: company.id }, { transaction });
    await transaction.commit();

    return company;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
async function getMyCompany(userId) {
  const user = await User.findByPk(userId);

  if (!user || !user.company_id) {
    const error = new Error("Your account is not linked to a company.");
    error.status = 404;
    throw error;
  }

  return Company.findByPk(user.company_id);
}
async function updateMyCompany(userId, companyData) {
  const user = await User.findByPk(userId);

  if (!user || !user.company_id) {
    const error = new Error("Your account is not linked to a company.");
    error.status = 404;
    throw error;
  }

  const company = await Company.findByPk(user.company_id);

  if (!company) {
    const error = new Error("Company was not found.");
    error.status = 404;
    throw error;
  }

  const email = companyData.email.trim().toLowerCase();
  const existingCompany = await Company.findOne({ where: { email } });

  if (existingCompany && existingCompany.id !== company.id) {
    const error = new Error("A company with this email already exists.");
    error.status = 409;
    throw error;
  }

  await company.update({
    name: companyData.name.trim(),
    email,
    website: companyData.website?.trim() || null,
    location: companyData.location?.trim() || null,
    industry: companyData.industry?.trim() || null,
    company_size: companyData.company_size?.trim() || null,
    logo_data:
  companyData.logo_data !== undefined
    ? companyData.logo_data || null
    : company.logo_data,
brand_colors:
  companyData.brand_colors !== undefined
    ? companyData.brand_colors
    : company.brand_colors,
  });

  return company;
}
function serviceError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getRecruiterWithCompany(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    throw serviceError(
      "Recruiter account must be linked to a company.",
      403
    );
  }

  return user;
}
async function inviteMember(userId, email) {
  const recruiter = await getRecruiterWithCompany(userId);
  const invitedEmail = String(email || "").trim().toLowerCase();

  if (!invitedEmail) {
    throw serviceError("Enter the member's email address.", 400);
  }

  if (invitedEmail === recruiter.email.toLowerCase()) {
    throw serviceError("You cannot invite your own email address.", 400);
  }

  const invitedUser = await User.findOne({
    where: { email: invitedEmail },
  });

  if (invitedUser && invitedUser.role !== "recruiter") {
    throw serviceError(
      "Only recruiter accounts can join a company team.",
      400
    );
  }

  if (invitedUser?.company_id) {
    if (Number(invitedUser.company_id) === Number(recruiter.company_id)) {
      throw serviceError(
        "That recruiter is already part of your company.",
        409
      );
    }

    throw serviceError(
      "That recruiter account is already linked to another company.",
      409
    );
  }

  const company = await Company.findByPk(recruiter.company_id);

  if (!company) {
    throw serviceError("Company was not found.", 404);
  }

  await CompanyInvitation.update(
    { used_at: new Date() },
    {
      where: {
        company_id: recruiter.company_id,
        invited_email: invitedEmail,
        used_at: null,
      },
    }
  );

  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 12);

  const invitation = await CompanyInvitation.create({
    company_id: recruiter.company_id,
    invited_by: recruiter.id,
    invited_email: invitedEmail,
    code_hash: codeHash,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    attempts: 0,
  });

  try {
    await emailService.sendCompanyInviteEmail(
      invitedEmail,
      company.name,
      code
    );
  } catch (error) {
    await invitation.update({ used_at: new Date() });
    throw serviceError(
      "Could not send the invitation email. Please try again.",
      503
    );
  }

  return {
    message: `Invitation code sent to ${invitedEmail}.`,
  };
}

async function acceptCompanyInvite(userId, code) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter") {
    throw serviceError("A recruiter account is required.", 403);
  }

  if (user.company_id) {
    throw serviceError(
      "This recruiter account is already linked to a company.",
      409
    );
  }

  const cleanCode = String(code || "").trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    throw serviceError("Enter the 6-digit invitation code.", 400);
  }

  const invitation = await CompanyInvitation.findOne({
    where: {
      invited_email: user.email.toLowerCase(),
      used_at: null,
    },
    order: [["created_at", "DESC"]],
  });

  if (!invitation) {
    throw serviceError(
      "No active invitation was found for your account email.",
      404
    );
  }

  if (invitation.expires_at <= new Date()) {
    await invitation.update({ used_at: new Date() });
    throw serviceError("That invitation code has expired.", 400);
  }

  if (invitation.attempts >= 5) {
    await invitation.update({ used_at: new Date() });
    throw serviceError(
      "Too many incorrect attempts. Ask the company to send a new invitation.",
      429
    );
  }

  const codeMatches = await bcrypt.compare(cleanCode, invitation.code_hash);

  if (!codeMatches) {
    const attempts = invitation.attempts + 1;
    await invitation.update({
      attempts,
      ...(attempts >= 5 ? { used_at: new Date() } : {}),
    });

    throw serviceError("The invitation code is incorrect.", 400);
  }

  const company = await Company.findByPk(invitation.company_id);

  if (!company) {
    throw serviceError("The inviting company was not found.", 404);
  }

  const transaction = await sequelize.transaction();

  try {
    const lockedUser = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const lockedInvitation = await CompanyInvitation.findByPk(invitation.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!lockedUser || lockedUser.company_id) {
      throw serviceError(
        "This recruiter account is already linked to a company.",
        409
      );
    }

    if (!lockedInvitation || lockedInvitation.used_at) {
      throw serviceError("This invitation has already been used.", 409);
    }

    await lockedUser.update(
      { company_id: company.id },
      { transaction }
    );
    await lockedInvitation.update(
      { used_at: new Date() },
      { transaction }
    );

    await transaction.commit();

    return {
      message: `You joined ${company.name}.`,
      company_id: company.id,
      company_name: company.name,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function listCompanyMembers(userId) {
  const recruiter = await getRecruiterWithCompany(userId);

  return User.findAll({
    where: { company_id: recruiter.company_id },
    attributes: ["id", "name", "email", "role", "created_at"],
    order: [["created_at", "ASC"]],
  });
}
module.exports = {
  createCompany,
  getMyCompany,
  updateMyCompany,
  inviteMember,
  acceptCompanyInvite,
  listCompanyMembers,
};