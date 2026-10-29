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
      message: "Please check the company information.",
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

module.exports = router;