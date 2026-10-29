const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const jobController = require("../controllers/jobController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the job information.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

router.get(
  "/admin",
  authenticateToken,
  allowRoles("admin"),
  jobController.listAllJobsForAdmin
);
router.get(
  "/mine",
  authenticateToken,
  allowRoles("recruiter"),
  jobController.listCompanyJobs
);
router.get("/", jobController.listActiveJobs);


router.post(
  "/",
  authenticateToken,
  allowRoles("recruiter"),
  [
    body("title").trim().notEmpty().withMessage("Job title is required."),
    body("description")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters."),
    body("job_type")
      .optional()
      .isIn(["full_time", "part_time", "contract", "internship"])
      .withMessage("Choose a valid job type."),
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
  jobController.createJob
);
router.patch(
  "/:jobId/status",
  authenticateToken,
  allowRoles("recruiter"),
  [
    param("jobId")
      .isInt({ min: 1 })
      .withMessage("Job ID must be a positive number."),
    body("status")
      .isIn(["draft", "active", "closed"])
      .withMessage("Status must be draft, active, or closed."),
  ],
  rejectInvalidInput,
  jobController.updateJobStatus
);
router.patch(
  "/:jobId",
  authenticateToken,
  allowRoles("recruiter"),
  [
    param("jobId")
      .isInt({ min: 1 })
      .withMessage("Job ID must be a positive number."),
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Job title cannot be empty."),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters."),
    body("job_type")
      .optional()
      .isIn(["full_time", "part_time", "contract", "internship"])
      .withMessage("Choose a valid job type."),
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
  jobController.updateJob
);
module.exports = router;