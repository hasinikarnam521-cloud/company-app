const express = require("express");
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/paymentAuth");

const router = express.Router();

router.post(
  "/create-order",
  authMiddleware,
  paymentController.createOrder
);

router.post(
  "/verify",
  authMiddleware,
  paymentController.verifyPayment
);

module.exports = router;