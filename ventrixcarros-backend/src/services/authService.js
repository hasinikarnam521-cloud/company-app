const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const sequelize = require("../config/database");
const User = require("../models/User");
const Company = require("../models/Company");
const LoginOtp = require("../models/LoginOtp");
const SignupOtp = require("../models/SignupOtp");
const emailService = require("./emailService");

async function register({ name, email, password, role, companyName }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name.trim();
  const normalizedCompanyName = companyName?.trim();

  const isRecruiter = role === "recruiter";

  if (isRecruiter && !normalizedCompanyName) {
    const error = new Error("Company name is required.");
    error.status = 400;
    throw error;
  }

  const existingUser = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.status = 409;
    throw error;
  }

  if (isRecruiter) {
    const existingCompany = await Company.findOne({
      where: { email: normalizedEmail },
    });

    if (existingCompany) {
      const error = new Error("A company account with this email already exists.");
      error.status = 409;
      throw error;
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await sequelize.transaction(async (transaction) => {
    let company = null;

    if (isRecruiter) {
      company = await Company.create(
        {
          name: normalizedCompanyName,
          email: normalizedEmail,
          status: "pending",
        },
        { transaction }
      );
    }

    return User.create(
      {
        name: normalizedName,
        email: normalizedEmail,
        password_hash: passwordHash,
        role: isRecruiter ? "recruiter" : "candidate",
        company_id: company ? company.id : null,
      },
      { transaction }
    );
  });

  await sendOtp(user, SignupOtp);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
    },
    otpRequired: true,
    message: "A verification code was sent to your email.",
  };
}

async function sendOtp(user, OtpModel) {
  await OtpModel.update(
    { used_at: new Date() },
    { where: { user_id: user.id, used_at: null } }
  );

  const code = crypto.randomInt(100000, 1000000).toString();
  const otpRecord = await OtpModel.create({
    user_id: user.id,
    code_hash: await bcrypt.hash(code, 10),
    expires_at: new Date(Date.now() + 60 * 1000),
    attempts: 0,
    used_at: null,
  });

  try {
    await emailService.sendOtpEmail(user.email, code);
  } catch (error) {
    console.error("Resend email error:", error);
    await otpRecord.update({ used_at: new Date() });

    const sendError = new Error("Could not send the verification code. Try again.");
    sendError.status = 503;
    sendError.cause = error;
    throw sendError;
  }
}

async function resendSignupOtp({ email }) {
  const user = await User.findOne({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    const error = new Error("No account was found for that email address.");
    error.status = 404;
    throw error;
  }

  const latestOtp = await SignupOtp.findOne({
    where: { user_id: user.id },
    order: [["created_at", "DESC"]],
  });

  if (!latestOtp || latestOtp.verified_at) {
    const error = new Error("This account does not need signup verification.");
    error.status = 400;
    throw error;
  }

  await sendOtp(user, SignupOtp);
  return { message: "A new verification code was sent to your email." };
}

async function login({ email, password }) {
  const user = await User.findOne({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const error = new Error("Email or password is incorrect.");
    error.status = 401;
    throw error;
  }

  const pendingSignupOtp = await SignupOtp.findOne({
    where: { user_id: user.id, verified_at: null },
  });

  if (pendingSignupOtp) {
    const error = new Error(
      "Verify your email from the signup page before logging in."
    );
    error.status = 403;
    throw error;
  }

  return {
    token: jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    ),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

async function verifyLoginOtp({ email, code }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^\d{6}$/.test(String(code || ""))) {
    const error = new Error("Enter the six-digit verification code.");
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    const error = new Error("The code is invalid or expired.");
    error.status = 401;
    throw error;
  }

  let otpRecord = await SignupOtp.findOne({
    where: { user_id: user.id, used_at: null },
    order: [["created_at", "DESC"]],
  });

  const isSignupOtp = Boolean(otpRecord);

  if (!otpRecord) {
    otpRecord = await LoginOtp.findOne({
      where: { user_id: user.id, used_at: null },
      order: [["created_at", "DESC"]],
    });
  }

  if (!otpRecord || otpRecord.expires_at <= new Date()) {
    if (otpRecord) {
      await otpRecord.update({ used_at: new Date() });
    }

    const error = new Error("The code is invalid or expired.");
    error.status = 401;
    throw error;
  }

  if (otpRecord.attempts >= 5) {
    await otpRecord.update({ used_at: new Date() });

    const error = new Error("Too many attempts. Request a new code.");
    error.status = 429;
    throw error;
  }

  const correct = await bcrypt.compare(String(code), otpRecord.code_hash);

  if (!correct) {
    const attempts = otpRecord.attempts + 1;

    await otpRecord.update({
      attempts,
      used_at: attempts >= 5 ? new Date() : null,
    });

    const error = new Error("The code is invalid or expired.");
    error.status = attempts >= 5 ? 429 : 401;
    throw error;
  }

  await otpRecord.update({
    used_at: new Date(),
    ...(isSignupOtp ? { verified_at: new Date() } : {}),
  });

  return {
    ...(!isSignupOtp
      ? {
          token: jwt.sign(
            { sub: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          ),
        }
      : {}),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    ...(isSignupOtp
      ? {
          paymentToken: jwt.sign(
            { sub: user.id, role: user.role, purpose: "signup_payment" },
            process.env.JWT_SECRET,
            { expiresIn: "30m" }
          ),
        }
      : {}),
  };
}

async function getCurrentUser(userId) {
  return User.findByPk(userId, {
    attributes: { exclude: ["password_hash"] },
  });
}

module.exports = {
  register,
  resendSignupOtp,
  login,
  verifyLoginOtp,
  getCurrentUser,
};