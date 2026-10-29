const express = require("express");
const { body, param, validationResult } = require("express-validator");
const authenticateToken = require("../middleware/auth");
const allowRoles = require("../middleware/roles");
const messageController = require("../controllers/messageController");

const router = express.Router();

function rejectInvalidInput(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Please check the message.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
}

router.get(
  "/conversations",
  authenticateToken,
  allowRoles("recruiter"),
  messageController.listConversations
);

router.get(
  "/:candidateId",
  authenticateToken,
  allowRoles("recruiter"),
  [param("candidateId").isInt({ min: 1 })],
  rejectInvalidInput,
  messageController.listMessages
);

router.post(
  "/:candidateId",
  authenticateToken,
  allowRoles("recruiter"),
  [
    param("candidateId").isInt({ min: 1 }),
    body("body")
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage("Message must be 1 to 5000 characters."),
  ],
  rejectInvalidInput,
  messageController.sendMessage
);

module.exports = router;