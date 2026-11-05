const express = require("express");
const authenticateToken = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const adminController = require("../controllers/adminController");
const adminSupportController = require("../controllers/adminSupportController");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");

function logAdminMutations(req, res, next) {
  const writeMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (!writeMethods.includes(req.method)) {
    return next();
  }

  res.on("finish", async () => {
    try {
      const admin = await User.findByPk(req.user.id, {
        attributes: ["name"],
      });

      await ActivityLog.create({
        admin_id: req.user.id,
        admin_name: admin?.name || "Admin",
        action: `${req.method} ${req.baseUrl}${req.route?.path || req.path}`,
        target: Object.values(req.params || {}).join(", ") || "Platform",
        ip_address: req.ip || null,
        status: res.statusCode < 400 ? "success" : "failed",
      });
    } catch (error) {
      console.error("Could not save admin activity log:", error.message);
    }
  });

  next();
}
const router = express.Router();


router.use(authenticateToken, adminOnly, logAdminMutations);

router.get("/dashboard", adminController.getDashboard);
router.get("/logs", adminController.getLogs);
router.get("/companies", adminController.getCompanies);
router.post("/companies", adminController.addCompany);
router.patch("/companies/:id", adminController.updateCompany);
router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.updateUser);
router.get("/subscriptions", adminController.getSubscriptions);
router.patch("/subscriptions/:id", adminController.updateSubscription);
router.get("/payments", adminController.getPayments);
router.get("/plans", adminController.getPlans);
router.get("/notifications", adminController.getNotifications);
router.post("/plans", adminController.addPlan);
router.get("/support", adminSupportController.getTickets);
router.post("/support", adminSupportController.createTicket);
router.patch("/support/:id", adminSupportController.updateTicket);
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

module.exports = router;