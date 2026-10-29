const { Op } = require("sequelize");

const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Message = require("../models/Message");
const User = require("../models/User");

async function getRecruiter(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error(
      "Recruiter account must be linked to a company."
    );
    error.status = 403;
    throw error;
  }

  return user;
}

async function ensureCandidateApplied(companyId, candidateId) {
  const application = await Application.findOne({
    where: {
      company_id: companyId,
      candidate_id: candidateId,
    },
  });

  if (!application) {
    const error = new Error(
      "This candidate has not applied to your company's jobs."
    );
    error.status = 404;
    throw error;
  }
}

async function listConversations(userId) {
  const user = await getRecruiter(userId);

  const applications = await Application.findAll({
    where: { company_id: user.company_id },
    include: [
      {
        model: Candidate,
        as: "candidate",
        attributes: ["id", "name", "email", "location", "current_role"],
      },
      {
        model: Job,
        as: "job",
        attributes: ["id", "title"],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  const messages = await Message.findAll({
    where: { company_id: user.company_id },
    order: [["created_at", "DESC"]],
  });

  const latestMessageByCandidate = new Map();
  const unreadCountByCandidate = new Map();

  for (const message of messages) {
    const candidateId = Number(message.candidate_id);

    if (!latestMessageByCandidate.has(candidateId)) {
      latestMessageByCandidate.set(candidateId, message);
    }

    if (message.sender_type === "candidate" && !message.read_at) {
      const currentCount = unreadCountByCandidate.get(candidateId) || 0;
      unreadCountByCandidate.set(candidateId, currentCount + 1);
    }
  }

  const conversationsByCandidate = new Map();

  for (const application of applications) {
    const candidate = application.candidate;

    if (!candidate) continue;

    const candidateId = Number(candidate.id);

    if (conversationsByCandidate.has(candidateId)) continue;

    const latestMessage = latestMessageByCandidate.get(candidateId);

    conversationsByCandidate.set(candidateId, {
      candidate_id: candidate.id,
      candidate,
      job: application.job,
      last_message: latestMessage?.body || "",
      last_message_at:
        latestMessage?.created_at || application.created_at,
      unread_count: unreadCountByCandidate.get(candidateId) || 0,
    });
  }

  return Array.from(conversationsByCandidate.values());
}

async function listMessages(userId, candidateId) {
  const user = await getRecruiter(userId);
  await ensureCandidateApplied(user.company_id, candidateId);

  await Message.update(
    { read_at: new Date() },
    {
      where: {
        company_id: user.company_id,
        candidate_id: candidateId,
        sender_type: "candidate",
        read_at: { [Op.is]: null },
      },
    }
  );

  return Message.findAll({
    where: {
      company_id: user.company_id,
      candidate_id: candidateId,
    },
    order: [["created_at", "ASC"]],
  });
}

async function sendMessage(userId, candidateId, body) {
  const user = await getRecruiter(userId);
  await ensureCandidateApplied(user.company_id, candidateId);

  return Message.create({
    company_id: user.company_id,
    candidate_id: candidateId,
    sender_user_id: user.id,
    sender_type: "recruiter",
    body: body.trim(),
  });
}

module.exports = {
  listConversations,
  listMessages,
  sendMessage,
};