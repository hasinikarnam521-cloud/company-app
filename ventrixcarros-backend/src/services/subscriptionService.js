const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const User = require("../models/User");

async function getCurrentSubscription(userId) {
  const user = await User.findByPk(userId);

  if (!user || !user.company_id) {
    const error = new Error("Your account is not linked to a company.");
    error.status = 403;
    throw error;
  }

  return Subscription.findOne({
    where: {
      company_id: user.company_id,
      status: "active",
    },
    include: [
      {
        model: Plan,
        as: "plan",
        attributes: ["id", "name", "slug", "price", "currency", "billing_cycle"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
}

module.exports = { getCurrentSubscription };