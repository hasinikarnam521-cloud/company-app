const express = require("express");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get(
  "/summary",
  authenticateToken,
  allowRoles("recruiter"),
  dashboardController.getRecruiterSummary
);

module.exports = router;