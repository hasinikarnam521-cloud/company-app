const sequelize = require("../config/database");
const razorpay = require("../config/payment");

const User = require("../models/User");
const Company = require("../models/Company");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const crypto = require("crypto");

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

async function verifySubscriptionPayment(userId, details) {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = details;

  if (!orderId || !paymentId || !signature) {
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
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${payment.provider_order_id}|${paymentId}`)
    .digest("hex");

  if (
    !/^[a-f0-9]{64}$/i.test(signature) ||
    !crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(signature, "hex")
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
module.exports = {
  createSubscriptionOrder,
  verifySubscriptionPayment,
};