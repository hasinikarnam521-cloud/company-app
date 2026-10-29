const planService = require("../services/planService");

async function listActivePlans(req, res, next) {
  try {
    const plans = await planService.listActivePlans();

    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listActivePlans };