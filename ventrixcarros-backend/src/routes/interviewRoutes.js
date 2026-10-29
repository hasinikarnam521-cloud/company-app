const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const interviewController = require("../controllers/interviewController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the interview information.",
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
  interviewController.listCompanyInterviews
);
router.get(
  "/mine",
  authenticateToken,
  allowRoles("candidate"),
  interviewController.listMyInterviews
);
router.post(
  "/applications/:applicationId",
  authenticateToken,
  allowRoles("recruiter"),
  [
    param("applicationId")
      .isInt({ min: 1 })
      .withMessage("Application ID must be a positive number."),
    body("interviewer")
      .trim()
      .notEmpty()
      .withMessage("Interviewer name is required."),
    body("interview_date")
      .isISO8601({ strict: true })
      .withMessage("Use a valid date in YYYY-MM-DD format."),
    body("interview_time")
      .matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
      .withMessage("Use 24-hour time, such as 14:30."),
    body("mode")
      .isIn(["online", "in_person", "phone"])
      .withMessage("Choose online, in_person, or phone."),
    body("meeting_link")
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage("Meeting link must be a valid URL."),
  ],
  rejectInvalidInput,
  interviewController.scheduleInterview
);

module.exports = router;