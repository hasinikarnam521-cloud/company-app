const express = require("express");
const { body, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const candidateController = require("../controllers/candidateController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the candidate profile information.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

router.use(authenticateToken, allowRoles("candidate"));

router.get("/me", candidateController.getMyProfile);

router.put(
  "/me",
  [
    body("phone").optional({ checkFalsy: true }).isString(),
    body("location").optional({ checkFalsy: true }).isString(),
    body("experience").optional({ checkFalsy: true }).isString(),
    body("current_role").optional({ checkFalsy: true }).isString(),
    body("expected_salary").optional({ checkFalsy: true }).isString(),
    body("resume_url")
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage("Resume URL must be a valid URL."),
    body("skills")
      .optional()
      .isArray()
      .withMessage("Skills must be a list."),
    body("skills.*")
      .optional()
      .isString()
      .withMessage("Each skill must be text."),
  ],
  rejectInvalidInput,
  candidateController.saveMyProfile
);

module.exports = router;