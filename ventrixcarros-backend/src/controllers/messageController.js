const messageService = require("../services/messageService");

async function listConversations(req, res, next) {
  try {
    const conversations = await messageService.listConversations(req.user.id);

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
}

async function listMessages(req, res, next) {
  try {
    const messages = await messageService.listMessages(
      req.user.id,
      Number(req.params.candidateId)
    );

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await messageService.sendMessage(
      req.user.id,
      Number(req.params.candidateId),
      req.body.body
    );

    res.status(201).json({
      success: true,
      message: "Message sent.",
      item: message,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listConversations,
  listMessages,
  sendMessage,
};