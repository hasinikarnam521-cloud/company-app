const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/paymentAuth");

const router = express.Router();

router.post("/create-order", authMiddleware, paymentController.createOrder);
router.post("/verify", authMiddleware, paymentController.verifyPayment);
router.get("/history", authMiddleware, paymentController.getBillingHistory);

// Razorpay calls this server-to-server, so it must not use login auth.
router.post("/webhook", paymentController.handleRazorpayWebhook);

module.exports = router;