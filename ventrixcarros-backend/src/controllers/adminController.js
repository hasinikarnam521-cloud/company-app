const { Op } = require("sequelize");
const User = require("../models/User");
const Company = require("../models/Company");
const Job = require("../models/Job");
const Payment = require("../models/Payment");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function formatCompany(company) {
  return {
    id: company.id,
    name: company.name,
    email: company.email,
    location: company.location,
    website: company.website,
    industry: company.industry,
    company_size: company.company_size,
    status: company.status,
    createdAt: company.createdAt,
    users: await User.count({ where: { company_id: company.id } }),
    activeJobs: await Job.count({
      where: { company_id: company.id, status: "active" },
    }),
  };
}

async function getDashboard(req, res, next) {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalCompanies, totalUsers, activeJobs, monthlyRevenue, companies] =
      await Promise.all([
        Company.count(),
        User.count(),
        Job.count({ where: { status: "active" } }),
        Payment.sum("amount", {
          where: {
            status: "paid",
            createdAt: { [Op.gte]: monthStart },
          },
        }),
        Company.findAll({
          attributes: ["id", "name", "email", "location", "status", "createdAt"],
          order: [["createdAt", "DESC"]],
          limit: 10,
        }),
      ]);

    const recentCompanies = await Promise.all(
      companies.map(formatCompany)
    );

    res.json({
      success: true,
      stats: {
        totalCompanies,
        totalUsers,
        activeJobs,
        monthlyRevenue: Number(monthlyRevenue || 0),
      },
      recentCompanies,
    });
  } catch (error) {
    next(error);
  }
}

async function getCompanies(req, res, next) {
  try {
    const companies = await Company.findAll({
      order: [["createdAt", "DESC"]],
    });

    const formattedCompanies = await Promise.all(
      companies.map(formatCompany)
    );

    res.json({
      success: true,
      stats: {
        totalCompanies: companies.length,
        activeCompanies: companies.filter((company) => company.status === "active").length,
        pendingCompanies: companies.filter((company) => company.status === "pending").length,
        inactiveCompanies: companies.filter((company) => company.status === "inactive").length,
      },
      companies: formattedCompanies,
    });
  } catch (error) {
    next(error);
  }
}

async function addCompany(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!name || !email) {
      throw createError("Company name and email are required.", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw createError("Enter a valid company email address.", 400);
    }

    const [existingCompany, existingUser] = await Promise.all([
      Company.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
    ]);

    if (existingCompany || existingUser) {
      throw createError("That email address is already in use.", 409);
    }

    const company = await Company.create({
      name,
      email,
      location: String(req.body.location || "").trim() || null,
      website: String(req.body.website || "").trim() || null,
      industry: String(req.body.industry || "").trim() || null,
      company_size: String(req.body.company_size || "").trim() || null,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Company added.",
      company: await formatCompany(company),
    });
  } catch (error) {
    next(error);
  }
}

async function updateCompany(req, res, next) {
  try {
    const companyId = Number(req.params.id);

    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw createError("Invalid company ID.", 400);
    }

    const company = await Company.findByPk(companyId);

    if (!company) {
      throw createError("Company was not found.", 404);
    }

    const updates = {};
    const fields = ["name", "email", "location", "website", "industry", "company_size"];

    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = String(req.body[field] || "").trim();
        updates[field] = field === "email"
          ? value.toLowerCase()
          : value || null;
      }
    }

    if (updates.name === null || updates.name === "") {
      throw createError("Company name cannot be empty.", 400);
    }

    if (updates.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) {
        throw createError("Enter a valid company email address.", 400);
      }

      const [existingCompany, existingUser] = await Promise.all([
        Company.findOne({
          where: {
            email: updates.email,
            id: { [Op.ne]: companyId },
          },
        }),
        User.findOne({ where: { email: updates.email } }),
      ]);

      if (existingCompany || existingUser) {
        throw createError("That email address is already in use.", 409);
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
      const allowedStatuses = ["active", "inactive", "pending"];
      const status = String(req.body.status);

      if (!allowedStatuses.includes(status)) {
        throw createError("Status must be active, inactive, or pending.", 400);
      }

      updates.status = status;
    }

    if (!Object.keys(updates).length) {
      throw createError("There are no company details to update.", 400);
    }

    await company.update(updates);

    res.json({
      success: true,
      message: "Company updated.",
      company: await formatCompany(company),
    });
  } catch (error) {
    next(error);
  }
}
async function getUsers(req, res, next) {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "company_id", "createdAt"],
      include: [{
        model: Company,
        as: "company",
        attributes: ["id", "name"],
        required: false,
      }],
      order: [["createdAt", "DESC"]],
    });

    const stats = {
      totalUsers: users.length,
      candidates: users.filter((user) => user.role === "candidate").length,
      recruiters: users.filter((user) => user.role === "recruiter").length,
      companyAdmins: users.filter((user) => user.role === "company_admin").length,
      admins: users.filter((user) => user.role === "admin").length,
    };

    res.json({
      success: true,
      stats,
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        companyName: user.company?.name || "",
        createdAt: user.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError("Invalid user ID.", 400);
    }

    const user = await User.findByPk(userId);

    if (!user) {
      throw createError("User was not found.", 404);
    }

    const updates = {};
    const roles = ["candidate", "recruiter", "company_admin", "admin"];

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      const name = String(req.body.name || "").trim();
      if (!name) throw createError("Name cannot be empty.", 400);
      updates.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "role")) {
      const role = String(req.body.role);
      if (!roles.includes(role)) {
        throw createError("Choose a valid user role.", 400);
      }

      if (user.id === Number(req.user.id) && role !== "admin") {
        throw createError("You cannot remove your own admin role.", 400);
      }

      if (user.role === "admin" && role !== "admin") {
        const adminCount = await User.count({ where: { role: "admin" } });
        if (adminCount <= 1) {
          throw createError("The last admin account cannot be demoted.", 400);
        }
      }

      updates.role = role;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "company_id")) {
      const rawCompanyId = req.body.company_id;
      const companyId =
        rawCompanyId === "" || rawCompanyId === null
          ? null
          : Number(rawCompanyId);

      if (companyId !== null) {
        if (!Number.isInteger(companyId) || !(await Company.findByPk(companyId))) {
          throw createError("Choose a valid company.", 400);
        }
      }

      updates.company_id = companyId;
    }

    if (!Object.keys(updates).length) {
      throw createError("There are no user details to update.", 400);
    }

    await user.update(updates);

    const updatedUser = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "role", "company_id", "createdAt"],
      include: [{
        model: Company,
        as: "company",
        attributes: ["id", "name"],
        required: false,
      }],
    });

    res.json({
      success: true,
      message: "User updated.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        company_id: updatedUser.company_id,
        companyName: updatedUser.company?.name || "",
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
async function getSubscriptions(req, res, next) {
  try {
    const [subscriptions, plans, activeCount, pendingCount, cancelledCount, expiredCount] =
      await Promise.all([
        Subscription.findAll({
          include: [
            { model: Company, as: "company", attributes: ["id", "name", "location"] },
            { model: Plan, as: "plan", attributes: ["id", "name", "price", "currency", "billing_cycle"] },
          ],
          order: [["created_at", "DESC"]],
        }),
        Plan.findAll({ order: [["name", "ASC"]] }),
        Subscription.count({ where: { status: "active" } }),
        Subscription.count({ where: { status: "pending" } }),
        Subscription.count({ where: { status: "cancelled" } }),
        Subscription.count({ where: { status: "expired" } }),
      ]);

    res.json({
      success: true,
      subscriptions,
      plans,
      stats: {
        total: activeCount + pendingCount + cancelledCount + expiredCount,
        active: activeCount,
        pending: pendingCount,
        cancelled: cancelledCount,
        expired: expiredCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateSubscription(req, res, next) {
  try {
    const { status, auto_renew } = req.body;
    const allowedStatuses = ["pending", "active", "cancelled", "expired"];

    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription was not found.",
      });
    }

    const updates = {};

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subscription status.",
        });
      }
      updates.status = status;
    }

    if (auto_renew !== undefined) {
      updates.auto_renew = Boolean(auto_renew);
    }

    await subscription.update(updates);

    res.json({
      success: true,
      message: "Subscription updated.",
      subscription,
    });
  } catch (error) {
    next(error);
  }
}

async function getPlans(req, res, next) {
  try {
    const plans = await Plan.findAll({ order: [["name", "ASC"]] });
    res.json({ success: true, plans });
  } catch (error) {
    next(error);
  }
}

async function addPlan(req, res, next) {
  try {
    const {
      name,
      slug,
      description,
      price,
      currency,
      billing_cycle,
      max_users,
      max_active_jobs,
      features,
    } = req.body;

    if (!String(name || "").trim() || !String(slug || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Plan name and slug are required.",
      });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid plan price.",
      });
    }

    const plan = await Plan.create({
      name: String(name).trim(),
      slug: String(slug).trim().toLowerCase(),
      description: description || null,
      price: parsedPrice,
      currency: currency || "INR",
      billing_cycle: billing_cycle || "monthly",
      max_users: Number.isInteger(Number(max_users)) ? Number(max_users) : -1,
      max_active_jobs: Number.isInteger(Number(max_active_jobs))
        ? Number(max_active_jobs)
        : 1,
      features: Array.isArray(features) ? features : [],
      is_active: true,
    });

    res.status(201).json({
      success: true,
      message: "Plan created.",
      plan,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      error.status = 409;
      error.message = "A plan already uses that slug.";
    }
    next(error);
  }
}
module.exports = {
  getDashboard,
  getCompanies,
  addCompany,
  updateCompany,
  getUsers,
  updateUser,
  getSubscriptions,
  updateSubscription,
  getPlans,
  addPlan,
};