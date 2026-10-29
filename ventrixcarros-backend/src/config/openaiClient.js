const OpenAI = require("openai");

let client;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const error = new Error("OpenAI is not configured. Check your backend .env file.");
    error.status = 503;
    throw error;
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

module.exports = getOpenAIClient;