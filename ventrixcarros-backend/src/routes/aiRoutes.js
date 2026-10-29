const express = require("express");
const { body, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const aiController = require("../controllers/aiController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the information you entered.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

const recruiterOnly = [authenticateToken, allowRoles("recruiter")];

router.post(
  "/screen",
  ...recruiterOnly,
  [
    body("jobId")
      .isInt({ min: 1 })
      .withMessage("Job ID must be a positive number."),
  ],
  rejectInvalidInput,
  aiController.screenCandidates
);

router.post(
  "/job-description",
  ...recruiterOnly,
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Enter a job title.")
      .isLength({ max: 150 })
      .withMessage("Job title must be 150 characters or fewer."),
    body("seniority").optional().isString().isLength({ max: 100 }),
    body("skills")
      .isArray({ min: 1 })
      .withMessage("Add at least one required skill."),
    body("skills.*").isString().trim().notEmpty(),
    body("location").optional().isString().isLength({ max: 150 }),
    body("employmentType").optional().isString().isLength({ max: 50 }),
    body("extraDetails").optional().isString().isLength({ max: 2000 }),
  ],
  rejectInvalidInput,
  aiController.generateJobDescription
);

router.post(
  "/interview-questions",
  ...recruiterOnly,
  [
    body("jobId")
      .isInt({ min: 1 })
      .withMessage("Job ID must be a positive number."),
    body("questionCount")
      .optional()
      .isInt({ min: 3, max: 12 })
      .withMessage("Question count must be from 3 to 12."),
  ],
  rejectInvalidInput,
  aiController.generateInterviewQuestions
);

router.post(
  "/skill-gap",
  ...recruiterOnly,
  [
    body("jobId")
      .isInt({ min: 1 })
      .withMessage("Job ID must be a positive number."),
    body("candidateId")
      .isInt({ min: 1 })
      .withMessage("Candidate ID must be a positive number."),
  ],
  rejectInvalidInput,
  aiController.analyzeSkillGap
);

router.post(
  "/bias-check",
  ...recruiterOnly,
  [
    body("jobId")
      .isInt({ min: 1 })
      .withMessage("Job ID must be a positive number."),
  ],
  rejectInvalidInput,
  aiController.checkJobDescriptionBias
);

router.post(
  "/time-to-hire",
  ...recruiterOnly,
  aiController.optimizeHiringWorkflow
);

module.exports = router;