const express = require("express");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/auth");
const profileController = require("../controllers/profileController");


const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the information you entered.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    success: false,
    message: "Too many code attempts. Please try again later.",
  },
});

router.post(
  "/register",
  
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").trim().isEmail().withMessage("Enter a valid email."),
    body("password")
      .isString()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters."),
    body("role")
      .optional()
      .isIn(["candidate", "recruiter"])
      .withMessage("Role must be candidate or recruiter."),
    body("companyName")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 150 })
      .withMessage("Company name must be between 1 and 150 characters."),
  ],
  rejectInvalidInput,
  authController.register
);
router.post(
  "/register/resend-otp",
  otpLimiter,
  [body("email").trim().isEmail().withMessage("Enter a valid email.")],
  rejectInvalidInput,
  authController.resendSignupOtp
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").trim().isEmail().withMessage("Enter a valid email."),
    body("password").isString().notEmpty().withMessage("Password is required."),
  ],
  rejectInvalidInput,
  authController.login
);

router.post(
  "/verify-otp",
  otpLimiter,
  [
    body("email").trim().isEmail().withMessage("Enter a valid email."),
    body("code")
      .isString()
      .matches(/^\d{6}$/)
      .withMessage("Enter the six-digit sign-in code."),
  ],
  rejectInvalidInput,
  authController.verifyOtp
);

const emailChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.put(
  "/profile",
  authenticateToken,
  body("name")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Name is required."),
  rejectInvalidInput,
  profileController.updateName
);

router.post(
  "/profile/email/request",
  authenticateToken,
  emailChangeLimiter,
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid new email address."),
  rejectInvalidInput,
  profileController.requestEmailChange
);

router.post(
  "/profile/email/verify",
  authenticateToken,
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid new email address."),
  body("code")
    .isString()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("Enter the 6-digit verification code."),
  rejectInvalidInput,
  profileController.verifyEmailChange
);
router.get("/me", authenticateToken, authController.currentUser);

module.exports = router;