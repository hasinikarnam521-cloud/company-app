const paymentService = require("../services/paymentService");

async function createOrder(req, res) {
  try {
    const planId = Number(req.body.planId);

    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({
        message: "A valid planId is required.",
      });
    }

    const order = await paymentService.createSubscriptionOrder(
      req.user.id,
      planId
    );

    return res.status(201).json({
      message: "Payment order created.",
      order,
    });
  } catch (error) {
    console.error("Create payment order error details:", error);

    return res.status(400).json({
      message: error.message || "Could not create payment order.",
    });
  }
}

async function verifyPayment(req, res) {
  try {
    const result = await paymentService.verifySubscriptionPayment(
      req.user.id,
      req.body
    );

    return res.status(200).json({
      message: "Payment verified and subscription activated.",
      subscription: result,
    });
  } catch (error) {
    console.error("Verify payment error:", error.message);

    return res.status(400).json({
      message: error.message || "Could not verify payment.",
    });
  }
}

async function getBillingHistory(req, res) {
  try {
    const result = await paymentService.getBillingHistory(req.user.id);

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Billing history error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Could not load billing history.",
    });
  }
}

async function handleRazorpayWebhook(req, res) {
  try {
    const result = await paymentService.handleRazorpayWebhook(
      req.rawBody,
      req.get("x-razorpay-signature")
    );

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);

    return res.status(error.status || 500).json({
      success: false,
      message: error.status
        ? error.message
        : "Webhook processing failed. Razorpay may retry the event.",
    });
  }
}

module.exports = {
  createOrder,
  verifyPayment,
  getBillingHistory,
  handleRazorpayWebhook,
};