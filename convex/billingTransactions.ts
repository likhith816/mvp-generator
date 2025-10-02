import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get monthly revenue from successful payments
export const getMonthlyRevenue = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const currentMonth = new Date();
    const defaultStartDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
    const defaultEndDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    
    const startDate = args.startDate || defaultStartDate;
    const endDate = args.endDate || defaultEndDate;

    // Get all successful payments in the date range
    const successfulPayments = await ctx.db
      .query("billingTransactions")
      .filter((q) => 
        q.and(
          q.gte(q.field("_creationTime"), startDate),
          q.lte(q.field("_creationTime"), endDate),
          q.eq(q.field("type"), "PAYMENT"),
          q.eq(q.field("status"), "SUCCEEDED")
        )
      )
      .collect();

    // Calculate total revenue in rupees
    const totalRevenue = successfulPayments.reduce((sum, payment) => {
      return sum + payment.netAmount;
    }, 0);

    // Calculate revenue by plan type based on amount
    const revenueBreakdown = {
      FREE: 0,
      PRO: 0,
      ENTERPRISE: 0,
      CUSTOM: 0
    };

    successfulPayments.forEach(payment => {
      const amountInRupees = payment.netAmount / 100;
      
      // Categorize by typical plan amounts in rupees
      if (amountInRupees === 0) {
        revenueBreakdown.FREE += amountInRupees;
      } else if (amountInRupees >= 2000 && amountInRupees <= 3000) { // ₹2500 PRO plan
        revenueBreakdown.PRO += amountInRupees;
      } else if (amountInRupees >= 8000 && amountInRupees <= 12000) { // ₹10000 ENTERPRISE plan
        revenueBreakdown.ENTERPRISE += amountInRupees;
      } else {
        revenueBreakdown.CUSTOM += amountInRupees;
      }
    });

    return {
      totalRevenue: totalRevenue / 100, // Convert paise to rupees
      transactionCount: successfulPayments.length,
      revenueBreakdown,
      dateRange: { startDate, endDate },
      transactions: successfulPayments.map(payment => ({
        id: payment._id,
        userId: payment.userId,
        amount: payment.netAmount / 100,
        currency: payment.currency,
        date: payment._creationTime,
        description: payment.description,
        paymentMethod: payment.paymentMethod.type
      }))
    };
  },
});

// Record a new payment transaction
export const recordPayment = mutation({
  args: {
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")),
    amount: v.number(), // Amount in paise (INR subunit)
    currency: v.string(),
    paymentMethodType: v.string(),
    externalTransactionId: v.optional(v.string()),
    description: v.optional(v.string()),
    billingPeriodStart: v.number(),
    billingPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction = await ctx.db.insert("billingTransactions", {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      transactionId,
      externalTransactionId: args.externalTransactionId,
      type: "PAYMENT",
      amount: args.amount,
      currency: args.currency,
      netAmount: args.amount, // Assuming no fees for now
      processingFee: 0,
      taxes: 0,
      paymentMethod: {
        type: args.paymentMethodType,
      },
      status: "SUCCEEDED",
      billingPeriod: {
        start: args.billingPeriodStart,
        end: args.billingPeriodEnd,
      },
      description: args.description || `Payment for subscription`,
      processedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return transaction;
  },
});

// Get transaction history for admin
export const getTransactionHistory = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;
    
    if (args.userId) {
      results = await ctx.db
        .query("billingTransactions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(args.limit || 50);
    } else {
      results = await ctx.db
        .query("billingTransactions")
        .order("desc")
        .take(args.limit || 50);
    }

    if (args.startDate || args.endDate) {
      results = results.filter(t => {
        const created = t._creationTime;
        if (args.startDate && created < args.startDate) return false;
        if (args.endDate && created > args.endDate) return false;
        return true;
      });
    }

    return results.map(transaction => ({
      id: transaction._id,
      userId: transaction.userId,
      transactionId: transaction.transactionId,
      type: transaction.type,
      amount: transaction.netAmount / 100,
      currency: transaction.currency,
      status: transaction.status,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod.type,
      date: transaction._creationTime,
    }));
  },
});

// Create sample billing transactions for testing (remove in production)
export const createSampleTransactions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
    
    // Sample transactions for current month in INR
    const sampleTransactions = [
      {
        amount: 250000, // ₹2500 PRO plan (in paise)
        description: "PRO plan subscription",
        days: 5
      },
      {
        amount: 1000000, // ₹10000 ENTERPRISE plan (in paise)
        description: "ENTERPRISE plan subscription", 
        days: 10
      },
      {
        amount: 250000, // Another ₹2500 PRO plan
        description: "PRO plan subscription",
        days: 15
      },
      {
        amount: 1000000, // Another ₹10000 ENTERPRISE plan
        description: "ENTERPRISE plan subscription",
        days: 20
      }
    ];

    const transactions = [];
    
    for (const sample of sampleTransactions) {
      const transactionDate = startOfMonth + (sample.days * 24 * 60 * 60 * 1000);
      const transactionId = `txn_${transactionDate}_${Math.random().toString(36).substr(2, 9)}`;
      
      const transaction = await ctx.db.insert("billingTransactions", {
        userId: "demo-user" as any, // Demo user ID
        transactionId,
        type: "PAYMENT",
        amount: sample.amount,
        currency: "INR",
        netAmount: sample.amount,
        processingFee: 0,
        taxes: 0,
        paymentMethod: {
          type: "card",
        },
        status: "SUCCEEDED",
        billingPeriod: {
          start: transactionDate,
          end: transactionDate + (30 * 24 * 60 * 60 * 1000),
        },
        description: sample.description,
        processedAt: transactionDate,
        createdAt: transactionDate,
        updatedAt: transactionDate,
      });
      
      transactions.push(transaction);
    }

    return {
      created: transactions.length,
      totalRevenue: sampleTransactions.reduce((sum, t) => sum + t.amount, 0) / 100,
      message: `Created ${transactions.length} sample transactions for current month`
    };
  },
});