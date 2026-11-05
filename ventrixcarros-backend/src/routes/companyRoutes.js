const express = require("express");
const { body, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const companyController = require("../controllers/companyController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the company or invitation information.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

router.get(
  "/mine",
  authenticateToken,
  allowRoles("recruiter"),
  companyController.getMyCompany
);

router.patch(
  "/mine",
  authenticateToken,
  allowRoles("recruiter"),
  [
    body("name").trim().notEmpty().withMessage("Company name is required."),
    body("email").trim().isEmail().withMessage("Enter a valid company email."),
    body("website")
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage("Enter a valid website URL."),
    body("location").optional({ checkFalsy: true }).isString(),
    body("industry").optional({ checkFalsy: true }).isString(),
    body("company_size").optional({ checkFalsy: true }).isString(),
    body("logo_data")
  .optional({ checkFalsy: true })
  .isString()
  .isLength({ max: 350000 })
  .withMessage("Logo image must be 350 KB or smaller."),

body("brand_colors").optional().custom((value) => {
  const keys = ["primary", "secondary", "accent", "dark"];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Brand colors must be an object.");
  }

  if (!keys.every((key) => /^#[0-9a-fA-F]{6}$/.test(value[key] || ""))) {
    throw new Error("Each brand color must be a 6-digit hex color.");
  }

  return true;
}),
  ],
  rejectInvalidInput,
  companyController.updateMyCompany
);

router.post(
  "/",
  authenticateToken,
  allowRoles("recruiter"),
  [
    body("name").trim().notEmpty().withMessage("Company name is required."),
    body("email").trim().isEmail().withMessage("Enter a valid company email."),
    body("website")
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage("Enter a valid website URL."),
    body("location").optional({ checkFalsy: true }).isString(),
    body("industry").optional({ checkFalsy: true }).isString(),
    body("company_size").optional({ checkFalsy: true }).isString(),
  ],
  rejectInvalidInput,
  companyController.createCompany
);

router.get(
  "/team",
  authenticateToken,
  allowRoles("recruiter"),
  companyController.listCompanyMembers
);

router.post(
  "/invite",
  authenticateToken,
  allowRoles("recruiter"),
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid member email address."),
  ],
  rejectInvalidInput,
  companyController.inviteMember
);

router.post(
  "/invite/accept",
  authenticateToken,
  allowRoles("recruiter"),
  [
    body("code")
      .isString()
      .matches(/^\d{6}$/)
      .withMessage("Enter the 6-digit invitation code."),
  ],
  rejectInvalidInput,
  companyController.acceptCompanyInvite
);

module.exports = router;