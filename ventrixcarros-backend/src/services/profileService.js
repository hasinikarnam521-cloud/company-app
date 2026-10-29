const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../models/User");
const EmailChangeOtp = require("../models/EmailChangeOtp");
const emailService = require("./emailService");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function updateName(userId, name) {
  const cleanName = String(name || "").trim();

  if (!cleanName) {
    throw createError("Name is required.", 400);
  }

  if (cleanName.length > 100) {
    throw createError("Name must be 100 characters or fewer.", 400);
  }

  const user = await User.findByPk(userId);

  if (!user) {
    throw createError("User account was not found.", 404);
  }

  await user.update({ name: cleanName });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

async function requestEmailChange(userId, email) {
  const requestedEmail = String(email || "").trim().toLowerCase();

  if (!requestedEmail) {
    throw createError("A new email address is required.", 400);
  }

  const user = await User.findByPk(userId);

  if (!user) {
    throw createError("User account was not found.", 404);
  }

  if (requestedEmail === user.email.toLowerCase()) {
    throw createError("That is already your registered email address.", 400);
  }

  const emailInUse = await User.findOne({
    where: { email: requestedEmail },
  });

  if (emailInUse) {
    throw createError("An account already uses that email address.", 409);
  }

  // Make any earlier email-change codes unusable.
  await EmailChangeOtp.update(
    { used_at: new Date() },
    {
      where: {
        user_id: userId,
        used_at: null,
      },
    }
  );

  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 12);

  const otpRecord = await EmailChangeOtp.create({
    user_id: userId,
    requested_email: requestedEmail,
    code_hash: codeHash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
  });

  try {
    await emailService.sendOtpEmail(requestedEmail, code);
  } catch (error) {
    await otpRecord.update({ used_at: new Date() });
    throw createError("Could not send the verification code. Please try again.", 503);
  }

  return {
    message: `A verification code was sent to ${requestedEmail}.`,
  };
}

async function verifyEmailChange(userId, email, code) {
  const requestedEmail = String(email || "").trim().toLowerCase();
  const cleanCode = String(code || "").trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    throw createError("Enter the 6-digit verification code.", 400);
  }

  const otpRecord = await EmailChangeOtp.findOne({
    where: {
      user_id: userId,
      requested_email: requestedEmail,
      used_at: null,
    },
    order: [["created_at", "DESC"]],
  });

  if (!otpRecord) {
    throw createError("No active verification code was found. Request a new one.", 400);
  }

  if (otpRecord.expires_at <= new Date()) {
    await otpRecord.update({ used_at: new Date() });
    throw createError("That code has expired. Request a new one.", 400);
  }

  if (otpRecord.attempts >= 5) {
    await otpRecord.update({ used_at: new Date() });
    throw createError("Too many attempts. Request a new code.", 429);
  }

  const codeMatches = await bcrypt.compare(cleanCode, otpRecord.code_hash);

  if (!codeMatches) {
    const attempts = otpRecord.attempts + 1;
    await otpRecord.update({
      attempts,
      used_at: attempts >= 5 ? new Date() : null,
    });
    throw createError("The verification code is incorrect.", 400);
  }

  const emailInUse = await User.findOne({
    where: {
      email: requestedEmail,
      id: { [Op.ne]: userId },
    },
  });

  if (emailInUse) {
    await otpRecord.update({ used_at: new Date() });
    throw createError("An account already uses that email address.", 409);
  }

  const user = await User.findByPk(userId);

  if (!user) {
    throw createError("User account was not found.", 404);
  }

  await user.update({ email: requestedEmail });
  await otpRecord.update({ used_at: new Date() });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

module.exports = {
  updateName,
  requestEmailChange,
  verifyEmailChange,
};