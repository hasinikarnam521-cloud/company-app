const express = require("express");
const authenticateToken = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const adminController = require("../controllers/adminController");
const adminSupportController = require("../controllers/adminSupportController");

const router = express.Router();

router.use(authenticateToken, adminOnly);

router.get("/dashboard", adminController.getDashboard);
router.get("/companies", adminController.getCompanies);
router.post("/companies", adminController.addCompany);
router.patch("/companies/:id", adminController.updateCompany);
router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.updateUser);
router.get("/subscriptions", adminController.getSubscriptions);
router.patch("/subscriptions/:id", adminController.updateSubscription);
router.get("/plans", adminController.getPlans);
router.post("/plans", adminController.addPlan);
router.get("/support", adminSupportController.getTickets);
router.post("/support", adminSupportController.createTicket);
router.patch("/support/:id", adminSupportController.updateTicket);

module.exports = router;