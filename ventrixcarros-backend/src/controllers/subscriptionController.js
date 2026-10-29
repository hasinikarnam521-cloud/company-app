const subscriptionService = require("../services/subscriptionService");

async function getCurrentSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.getCurrentSubscription(req.user.id);

    res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCurrentSubscription };