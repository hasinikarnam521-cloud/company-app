function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing from .env");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is missing from .env");
  }

  return { apiKey, from };
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

async function sendEmail({ email, subject, text, html }) {
  const { apiKey, from } = getResendConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text,
      html,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `Resend email request failed (${response.status}).`
    );
  }
}

async function sendOtpEmail(email, code) {
  await sendEmail({
    email,
    subject: "Your VentrixCarros verification code",
    text: `Your verification code is ${code}. It expires in 1 minute.`,
    html: `
      <p>Your VentrixCarros verification code is:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${escapeHTML(code)}</p>
      <p>This code expires in 1 minute.</p>
    `,
  });
}

async function sendCompanyInviteEmail(email, companyName, code) {
  const safeCompanyName = escapeHTML(companyName);
  const safeEmail = escapeHTML(email);
  const safeCode = escapeHTML(code);

  await sendEmail({
    email,
    subject: `Invitation to join ${companyName} on VentrixCarros`,
    text:
      `${companyName} invited you to join its VentrixCarros team.\n\n` +
      `If you do not have a VentrixCarros account, open the signup page, ` +
      `use this email address (${email}), enter the invitation code, and ` +
      `leave the company name blank. The code is ${code} and expires in 24 hours.\n\n` +
      `If you already have a recruiter account that is not linked to a company, ` +
      `sign in, open Company Profile, and choose Accept invitation.`,
    html: `
      <p><strong>${safeCompanyName}</strong> invited you to join its VentrixCarros team.</p>
      <p>If you do not have a VentrixCarros account, open the signup page, use this email address (<strong>${safeEmail}</strong>), enter the invitation code, and leave the company name blank.</p>
      <p>Your invitation code is:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${safeCode}</p>
      <p>The code expires in 24 hours.</p>
      <p>If you already have a recruiter account that is not linked to a company, sign in, open Company Profile, and choose <strong>Accept invitation</strong>.</p>
    `,
  });
}

module.exports = {
  sendOtpEmail,
  sendCompanyInviteEmail,
};