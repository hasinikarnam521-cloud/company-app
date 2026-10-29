const getOpenAIClient = require("../config/openaiClient");

async function generateText(instructions, input, maxOutputTokens = 1200) {
  const client = getOpenAIClient();

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions,
      input: typeof input === "string" ? input : JSON.stringify(input),
      max_output_tokens: maxOutputTokens,
    });

    const text = response.output_text?.trim();

    if (!text) {
      const error = new Error("OpenAI returned an empty response.");
      error.status = 502;
      throw error;
    }

    return text;
  } catch (error) {
    if (error.status) throw error;

    console.error("OpenAI request failed:", error.message);

    const apiError = new Error(
      "OpenAI could not complete the request. Check your API key, billing, and model settings."
    );
    apiError.status = 502;
    throw apiError;
  }
}

async function generateJSON(
  instructions,
  input,
  schemaName,
  schema,
  maxOutputTokens = 1200
) {
  const client = getOpenAIClient();

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions,
      input: typeof input === "string" ? input : JSON.stringify(input),
      max_output_tokens: maxOutputTokens,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: true,
          schema,
        },
      },
    });

    const text = response.output_text?.trim();

    if (!text) {
      const error = new Error("OpenAI returned an empty response.");
      error.status = 502;
      throw error;
    }

    return JSON.parse(text);
  } catch (error) {
    if (error.status) throw error;

    console.error("OpenAI structured request failed:", error.message);

    const apiError = new Error(
      "OpenAI could not complete the request. Check your API key, billing, and model settings."
    );
    apiError.status = 502;
    throw apiError;
  }
}

module.exports = {
  generateText,
  generateJSON,
};