const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "test-only-secret-for-otp-tests";

const User = require("../src/models/User");
const SignupOtp = require("../src/models/SignupOtp");
const CompanyInvitation = require("../src/models/CompanyInvitation");
const authService = require("../src/services/authService");

function replace(target, key, value, t) {
  const original = target[key];
  target[key] = value;
  t.after(() => { target[key] = original; });
}

async function setupVerifiedRecruiter(t, invitation) {
  const codeHash = await bcrypt.hash("123456", 4);
  const updated = [];
  const user = { id: 42, name: "Test Recruiter", email: "person@example.com", role: "recruiter", company_id: 9 };
  replace(User, "findOne", async () => user, t);
  replace(SignupOtp, "findOne", async () => ({
    code_hash: codeHash,
    expires_at: new Date(Date.now() + 60_000),
    attempts: 0,
    update: async (values) => updated.push(values),
  }), t);
  let invitationQuery;
  replace(CompanyInvitation, "findOne", async (options) => {
    invitationQuery = options;
    return invitation;
  }, t);
  return { updated, get invitationQuery() { return invitationQuery; } };
}

test("new recruiter signup OTP returns a payment token", async (t) => {
  const state = await setupVerifiedRecruiter(t, null);
  const result = await authService.verifyLoginOtp({ email: "PERSON@example.com", code: "123456" });
  assert.equal(typeof result.paymentToken, "string");
  assert.equal(result.token, undefined);
  assert.equal(state.updated.length, 1);
  assert.ok(state.updated[0].verified_at instanceof Date);
  assert.equal(state.invitationQuery.where.invited_email, "person@example.com");
});

test("invited recruiter signup OTP returns a login token", async (t) => {
  await setupVerifiedRecruiter(t, { id: 3 });
  const result = await authService.verifyLoginOtp({ email: "person@example.com", code: "123456" });
  assert.equal(typeof result.token, "string");
  assert.equal(result.paymentToken, undefined);
});
