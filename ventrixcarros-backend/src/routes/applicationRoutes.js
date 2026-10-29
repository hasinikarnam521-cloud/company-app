const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const applicationController = require("../controllers/applicationController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "A valid job ID is required.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}
router.get(
  "/",
  authenticateToken,
  allowRoles("recruiter"),
  applicationController.listCompanyApplications
);
router.post(
  "/:jobId",
  authenticateToken,
  allowRoles("candidate"),
  [param("jobId").isInt({ min: 1 }).withMessage("Job ID must be a positive number.")],
  rejectInvalidInput,
  applicationController.applyToJob
);
router.patch(
  "/:applicationId/status",
  authenticateToken,
  allowRoles("recruiter"),
  [
    param("applicationId")
      .isInt({ min: 1 })
      .withMessage("Application ID must be a positive number."),
    body("status")
      .isIn(["submitted", "reviewing", "shortlisted", "rejected", "hired"])
      .withMessage("Choose a valid application status."),
    body("notes").optional().isString().withMessage("Notes must be text."),
  ],
  rejectInvalidInput,
  applicationController.updateApplicationStatus
);
router.get(
  "/mine",
  authenticateToken,
  allowRoles("candidate"),
  applicationController.listMyApplications
);

module.exports = router;