const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      otpRequired: result.otpRequired,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

async function resendSignupOtp(req, res, next) {
  try {
    const result = await authService.resendSignupOtp(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      message: "Login successful.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const result = await authService.verifyLoginOtp(req.body);

    res.json({
      success: true,
      message: result.paymentToken
        ? "Email verified. Continue to payment."
        : "Login successful.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

async function currentUser(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account was not found.",
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  resendSignupOtp,
  login,
  verifyOtp,
  currentUser,
};