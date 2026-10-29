const SupportTicket = require("../models/SupportTicket");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getTickets(req, res, next) {
  try {
    const tickets = await SupportTicket.findAll({
      order: [["created_at", "DESC"]],
    });

    const stats = {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      in_progress: tickets.filter(
        (ticket) => ticket.status === "in_progress"
      ).length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
      high_priority: tickets.filter(
        (ticket) => ticket.priority === "high"
      ).length,
    };

    res.json({ success: true, tickets, stats });
  } catch (error) {
    next(error);
  }
}

async function createTicket(req, res, next) {
  try {
    const subject = String(req.body.subject || "").trim();
    const description = String(req.body.description || "").trim();
    const companyName = String(req.body.company_name || "").trim();
    const contactEmail = String(req.body.contact_email || "")
      .trim()
      .toLowerCase();
    const priority = String(req.body.priority || "medium").toLowerCase();

    if (!subject || !description) {
      throw createError("Ticket subject and description are required.", 400);
    }

    if (subject.length > 200) {
      throw createError("Subject must be 200 characters or fewer.", 400);
    }

    if (!["low", "medium", "high"].includes(priority)) {
      throw createError("Priority must be low, medium, or high.", 400);
    }

    const ticket = await SupportTicket.create({
      company_name: companyName || null,
      contact_email: contactEmail || null,
      subject,
      description,
      priority,
      status: "open",
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created.",
      ticket,
    });
  } catch (error) {
    next(error);
  }
}

async function updateTicket(req, res, next) {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);

    if (!ticket) {
      throw createError("Support ticket was not found.", 404);
    }

    const updates = {};
    const allowedStatuses = ["open", "in_progress", "resolved"];
    const allowedPriorities = ["low", "medium", "high"];

    if (req.body.status !== undefined) {
      const status = String(req.body.status).toLowerCase();
      if (!allowedStatuses.includes(status)) {
        throw createError("Invalid ticket status.", 400);
      }
      updates.status = status;
    }

    if (req.body.priority !== undefined) {
      const priority = String(req.body.priority).toLowerCase();
      if (!allowedPriorities.includes(priority)) {
        throw createError("Invalid ticket priority.", 400);
      }
      updates.priority = priority;
    }

    if (Object.keys(updates).length === 0) {
      throw createError("Provide a status or priority to update.", 400);
    }

    await ticket.update(updates);

    res.json({
      success: true,
      message: "Support ticket updated.",
      ticket,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTickets,
  createTicket,
  updateTicket,
};