async function sendOtpEmail(email, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing from .env");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is missing from .env");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your VentrixCarros verification code",
      text: `Your verification code is ${code}. It expires in 1 minute.`,
      html: `
        <p>Your VentrixCarros verification code is:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p>This code expires in 1 minute.</p>
      `,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || `Resend email request failed (${response.status}).`);
  }
}

module.exports = { sendOtpEmail };