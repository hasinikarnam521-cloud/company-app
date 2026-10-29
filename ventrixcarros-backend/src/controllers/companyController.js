const companyService = require("../services/companyService");

async function createCompany(req, res, next) {
  try {
    const company = await companyService.createCompany(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: "Company created.",
      company,
    });
  } catch (error) {
    next(error);
  }
}
async function getMyCompany(req, res, next) {
  try {
    const company = await companyService.getMyCompany(req.user.id);

    res.json({
      success: true,
      company,
    });
  } catch (error) {
    next(error);
  }
}
async function updateMyCompany(req, res, next) {
  try {
    const company = await companyService.updateMyCompany(req.user.id, req.body);

    res.json({
      success: true,
      message: "Company details saved.",
      company,
    });
  } catch (error) {
    next(error);
  }
}
module.exports = {
  createCompany,
  getMyCompany,
  updateMyCompany,
};