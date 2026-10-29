const Plan = require("../models/Plan");

async function listActivePlans() {
  return Plan.findAll({
    where: { is_active: true },
    attributes: [
      "id",
      "name",
      "slug",
      "description",
      "price",
      "currency",
      "billing_cycle",
      "max_users",
      "max_active_jobs",
      "features",
    ],
    order: [["price", "ASC"]],
  });
}

module.exports = { listActivePlans };