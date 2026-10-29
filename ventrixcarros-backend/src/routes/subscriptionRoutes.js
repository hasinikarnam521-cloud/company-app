const express = require("express");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const subscriptionController = require("../controllers/subscriptionController");

const router = express.Router();

router.get(
  "/current",
  authenticateToken,
  allowRoles("recruiter", "company_admin"),
  subscriptionController.getCurrentSubscription
);

module.exports = router;