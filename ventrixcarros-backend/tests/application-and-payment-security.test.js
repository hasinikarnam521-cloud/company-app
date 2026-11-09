const test = require("node:test");
const assert = require("node:assert/strict");

process.env.RAZORPAY_KEY_ID = "test_key_for_unit_tests";
process.env.RAZORPAY_KEY_SECRET = "test_secret_for_unit_tests";

const User = require("../src/models/User");
const Application = require("../src/models/Application");
const Payment = require("../src/models/Payment");
const applicationService = require("../src/services/applicationService");
const paymentService = require("../src/services/paymentService");

function replace(target, key, value, t) {
  const original = target[key];
  target[key] = value;
  t.after(() => { target[key] = original; });
}

test("company application list is restricted to the recruiter's company", async (t) => {
  replace(User, "findByPk", async () => ({ id: 4, role: "recruiter", company_id: 20 }), t);
  let query;
  replace(Application, "findAll", async (options) => { query = options; return []; }, t);

  await applicationService.listCompanyApplications(4);

  assert.deepEqual(query.where, { company_id: 20 });
});

test("application status updates look up records within the recruiter's company", async (t) => {
  replace(User, "findByPk", async () => ({ id: 4, role: "recruiter", company_id: 20 }), t);
  let query;
  let saved;
  replace(Application, "findOne", async (options) => {
    query = options;
    return { update: async (values) => { saved = values; } };
  }, t);

  await applicationService.updateApplicationStatus(4, 12, "reviewing", "  Check skills  ");

  assert.deepEqual(query.where, { id: 12, company_id: 20 });
  assert.deepEqual(saved, { status: "reviewing", notes: "Check skills" });
});

test("payment verification rejects an invalid signature before contacting Razorpay", async (t) => {
  replace(User, "findByPk", async () => ({ id: 4, company_id: 20 }), t);
  replace(Payment, "findOne", async () => ({
    id: 3,
    provider_order_id: "order_test_123",
    subscription_id: 9,
    company_id: 20,
    amount: "499.00",
    currency: "INR",
  }), t);

  await assert.rejects(
    paymentService.verifySubscriptionPayment(4, {
      razorpay_order_id: "order_test_123",
      razorpay_payment_id: "pay_test_123",
      razorpay_signature: "f".repeat(64),
    }),
    /Payment signature is invalid\./
  );
});

test("webhook handling rejects an invalid Razorpay signature", async () => {
  process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
  await assert.rejects(
    paymentService.handleRazorpayWebhook(
      Buffer.from(JSON.stringify({ event: "payment.captured" })),
      "f".repeat(64)
    ),
    (error) => error.status === 400 && /signature verification failed/i.test(error.message)
  );
});
