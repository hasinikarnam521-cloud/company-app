const sequelize = require("../config/database");
const razorpay = require("../config/payment");
const crypto = require("crypto");

const User = require("../models/User");
const Company = require("../models/Company");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");

async function createSubscriptionOrder(userId, planId) {
  const user = await User.findByPk(userId);

  if (!user || !user.company_id) {
    throw new Error("Your account is not connected to a company.");
  }

  const company = await Company.findByPk(user.company_id);

  if (!company) {
    throw new Error("Company not found.");
  }

  const plan = await Plan.findOne({
    where: {
      id: planId,
      is_active: true,
    },
  });

  if (!plan) {
    throw new Error("Active plan not found.");
  }

  const amountInPaise = Math.round(Number(plan.price) * 100);

  if (!Number.isSafeInteger(amountInPaise) || amountInPaise <= 0) {
    throw new Error("The plan price is invalid.");
  }

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: plan.currency,
    receipt: `company_${company.id}_${Date.now()}`,
    notes: {
      company_id: String(company.id),
      plan_id: String(plan.id),
    },
  });

  const transaction = await sequelize.transaction();

  try {
    const subscription = await Subscription.create(
      {
        company_id: company.id,
        plan_id: plan.id,
        status: "pending",
        starts_at: null,
        ends_at: null,
        auto_renew: false,
      },
      { transaction }
    );

    await Payment.create(
      {
        company_id: company.id,
        subscription_id: subscription.id,
        provider: "razorpay",
        provider_order_id: order.id,
        amount: plan.price,
        currency: plan.currency,
        status: "pending",
      },
      { transaction }
    );

    await transaction.commit();

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

function addOneMonthClamped(date) {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + 1);

  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return result;
}

async function ensureInvoiceForPayment(payment, transaction) {
  const existingInvoice = await Invoice.findOne({
    where: { payment_id: payment.id },
    transaction,
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const invoiceNumber = [
    "VC",
    payment.company_id,
    Date.now(),
    crypto.randomBytes(3).toString("hex").toUpperCase(),
  ].join("-");

  return Invoice.create(
    {
      company_id: payment.company_id,
      subscription_id: payment.subscription_id,
      payment_id: payment.id,
      invoice_number: invoiceNumber,
      amount: payment.amount,
      currency: payment.currency,
      status: "paid",
      issued_at: new Date(),
      due_date: null,
      pdf_url: null,
    },
    { transaction }
  );
}

async function verifySubscriptionPayment(userId, details) {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = details || {};

  if (!orderId || !paymentId || typeof signature !== "string") {
    throw new Error("Payment verification details are incomplete.");
  }

  const user = await User.findByPk(userId);

  if (!user || !user.company_id) {
    throw new Error("Your account is not connected to a company.");
  }

  const payment = await Payment.findOne({
    where: {
      provider: "razorpay",
      provider_order_id: orderId,
      company_id: user.company_id,
    },
  });

  if (!payment || !payment.subscription_id) {
    throw new Error("Payment order not found for your company.");
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("Razorpay payment verification is not configured.");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${payment.provider_order_id}|${paymentId}`)
    .digest("hex");

  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    throw new Error("Payment signature is invalid.");
  }

  const receivedSignature = signature.toLowerCase();

  if (
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(receivedSignature, "hex")
    )
  ) {
    throw new Error("Payment signature is invalid.");
  }

  const razorpayPayment = await razorpay.payments.fetch(paymentId);
  const expectedAmountInPaise = Math.round(Number(payment.amount) * 100);

  if (
    razorpayPayment.order_id !== payment.provider_order_id ||
    razorpayPayment.status !== "captured" ||
    razorpayPayment.amount !== expectedAmountInPaise ||
    razorpayPayment.currency !== payment.currency
  ) {
    throw new Error("Razorpay has not confirmed the expected captured payment.");
  }

  const transaction = await sequelize.transaction();

  try {
    const savedPayment = await Payment.findByPk(payment.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!savedPayment) {
      throw new Error("Payment record was not found.");
    }

    const subscription = await Subscription.findByPk(
      savedPayment.subscription_id,
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      }
    );

    if (!subscription) {
      throw new Error("Subscription record not found.");
    }

    if (savedPayment.status === "paid") {
      if (savedPayment.provider_payment_id !== paymentId) {
        throw new Error("This order was already confirmed with another payment.");
      }

      await ensureInvoiceForPayment(savedPayment, transaction);
      await transaction.commit();

      return {
        status: subscription.status,
        startsAt: subscription.starts_at,
        endsAt: subscription.ends_at,
      };
    }

    const startsAt = new Date();
    const endsAt = addOneMonthClamped(startsAt);

    await savedPayment.update(
      {
        status: "paid",
        provider_payment_id: paymentId,
        payment_method: razorpayPayment.method || null,
      },
      { transaction }
    );

    await subscription.update(
      {
        status: "active",
        starts_at: startsAt,
        ends_at: endsAt,
      },
      { transaction }
    );

    await ensureInvoiceForPayment(savedPayment, transaction);
    await transaction.commit();

    return {
      status: "active",
      startsAt,
      endsAt,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
async function getBillingHistory(userId) {
  const user = await User.findByPk(userId);

  if (!user || user.role !== "recruiter" || !user.company_id) {
    const error = new Error("Recruiter account must be linked to a company.");
    error.status = 403;
    throw error;
  }

  const company = await Company.findByPk(user.company_id, {
    attributes: ["id", "name", "email", "location"],
  });

  async function loadPayments() {
    return Payment.findAll({
      where: { company_id: user.company_id },
      attributes: [
        "id",
        "subscription_id",
        "provider",
        "provider_order_id",
        "provider_payment_id",
        "amount",
        "currency",
        "status",
        "payment_method",
        "receipt_url",
        "created_at",
      ],
      include: [
        {
          model: Subscription,
          as: "subscription",
          attributes: ["id", "plan_id", "status", "starts_at", "ends_at"],
          include: [
            {
              model: Plan,
              as: "plan",
              attributes: ["id", "name", "billing_cycle"],
            },
          ],
        },
        {
          model: Invoice,
          as: "invoices",
          attributes: [
            "id",
            "invoice_number",
            "amount",
            "currency",
            "status",
            "issued_at",
            "pdf_url",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  let payments = await loadPayments();
  let createdMissingInvoice = false;

  for (const payment of payments) {
    const invoices = payment.invoices || [];

    if (payment.status === "paid" && invoices.length === 0) {
      const transaction = await sequelize.transaction();

      try {
        const lockedPayment = await Payment.findByPk(payment.id, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (lockedPayment && lockedPayment.status === "paid") {
          await ensureInvoiceForPayment(lockedPayment, transaction);
          createdMissingInvoice = true;
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }
  }

  if (createdMissingInvoice) {
    payments = await loadPayments();
  }

  return {
    company: company ? company.toJSON() : null,
    payments: payments.map((payment) => payment.toJSON()),
  };
}
async function handleRazorpayWebhook(rawBody, signature) {
  function webhookError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw webhookError("Razorpay webhook secret is not configured.", 500);
  }

  if (!Buffer.isBuffer(rawBody)) {
    throw webhookError("Webhook request body is missing.", 400);
  }

  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    throw webhookError("Webhook signature is missing or invalid.", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest();

  const receivedSignature = Buffer.from(signature, "hex");

  if (
    receivedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    throw webhookError("Webhook signature verification failed.", 400);
  }

  let event;

  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw webhookError("Webhook body is not valid JSON.", 400);
  }

  // Subscribe to payment.captured in the Razorpay dashboard.
  // Other events are acknowledged but do not activate subscriptions.
  if (event.event !== "payment.captured") {
    return { received: true, ignored: true };
  }

  const razorpayPayment = event.payload?.payment?.entity;

  if (
    !razorpayPayment ||
    razorpayPayment.status !== "captured" ||
    !razorpayPayment.id ||
    !razorpayPayment.order_id
  ) {
    throw webhookError("Captured payment details are missing.", 400);
  }

  const savedPayment = await Payment.findOne({
    where: {
      provider: "razorpay",
      provider_order_id: razorpayPayment.order_id,
    },
  });

  if (!savedPayment) {
    return { received: true, ignored: true };
  }

  const expectedAmount = Math.round(Number(savedPayment.amount) * 100);

  if (
    Number(razorpayPayment.amount) !== expectedAmount ||
    razorpayPayment.currency !== savedPayment.currency
  ) {
    throw webhookError("Webhook payment amount or currency did not match.", 400);
  }

  const recruiter = await User.findOne({
    where: {
      company_id: savedPayment.company_id,
      role: "recruiter",
    },
    attributes: ["id"],
  });

  if (!recruiter) {
    throw webhookError("No recruiter account was found for this payment.", 500);
  }

  // Reuse the existing server-side payment check and activation logic.
  const apiSecret = process.env.RAZORPAY_KEY_SECRET;

  if (!apiSecret) {
    throw webhookError("Razorpay API secret is not configured.", 500);
  }

  const checkoutSignature = crypto
    .createHmac("sha256", apiSecret)
    .update(`${razorpayPayment.order_id}|${razorpayPayment.id}`)
    .digest("hex");

  const result = await verifySubscriptionPayment(recruiter.id, {
    razorpay_order_id: razorpayPayment.order_id,
    razorpay_payment_id: razorpayPayment.id,
    razorpay_signature: checkoutSignature,
  });

  return { received: true, ignored: false, subscription: result };
}

module.exports = {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getBillingHistory,
  handleRazorpayWebhook,
};