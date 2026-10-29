require("dotenv").config();

const sequelize = require("./config/database");
const Plan = require("./models/Plan");

async function seedBasicPlan() {
  try {
    await sequelize.authenticate();

    const [plan, created] = await Plan.findOrCreate({
      where: { slug: "basic" },
      defaults: {
        name: "Basic",
        slug: "basic",
        description: "Basic monthly subscription",
        price: 499.00,
        currency: "INR",
        billing_cycle: "monthly",
        max_users: -1,
        max_active_jobs: 10,
        features: [],
        is_active: true,
      },
    });
    await plan.update({ max_active_jobs: -1 });

    console.log(created ? "Basic plan added." : "Basic plan already exists.");
    console.log(`Plan ID: ${plan.id}`);
  } catch (error) {
    console.error("Could not add the Basic plan:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seedBasicPlan();