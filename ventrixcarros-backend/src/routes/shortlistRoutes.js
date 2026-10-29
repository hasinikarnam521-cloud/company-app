const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const shortlistController = require("../controllers/shortlistController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the shortlist information.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

router.use(authenticateToken, allowRoles("recruiter"));

router.get("/", shortlistController.listShortlist);

router.post(
  "/jobs/:jobId",
  [
    param("jobId").isInt({ min: 1 }).withMessage("Job ID must be a positive number."),
    body("candidateId")
      .isInt({ min: 1 })
      .withMessage("Candidate ID must be a positive number."),
  ],
  rejectInvalidInput,
  shortlistController.addToShortlist
);

module.exports = router;