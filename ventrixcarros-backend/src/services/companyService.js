const sequelize = require("../config/database");
const Company = require("../models/Company");
const User = require("../models/User");

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
  });

  return company;
}
module.exports = {
  createCompany,
  getMyCompany,
  updateMyCompany,
};