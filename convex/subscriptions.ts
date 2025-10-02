import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Create a new subscription for a user
export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    planType: v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE"), v.literal("CUSTOM")),
    planId: v.optional(v.string()),
    pricing: v.optional(v.object({
      amount: v.number(),
      currency: v.string(),
      billingInterval: v.union(v.literal("MONTHLY"), v.literal("YEARLY"), v.literal("LIFETIME"), v.literal("FREE")),
      intervalCount: v.optional(v.number()),
    })),
    billingInfo: v.optional(v.object({
      customerId: v.optional(v.string()),
      subscriptionId: v.optional(v.string()),
      paymentMethodId: v.optional(v.string()),
    })),
    startTrial: v.optional(v.boolean()),
    trialDays: v.optional(v.number()),
    metadata: v.optional(v.object({
      source: v.optional(v.string()),
      referralCode: v.optional(v.string()),
      promotionCode: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get user details
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Cancel any existing active subscriptions
    const existingSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .collect();

    for (const sub of existingSubscriptions) {
      await ctx.db.patch(sub._id, {
        isActive: false,
        status: "CANCELED",
        cancelDate: now,
        endDate: now,
        updatedAt: now,
      });
    }

    // Define plan features based on plan type
    const planFeatures = {
      FREE: {
        apiCallsLimit: 10,
        mvpGenerationsLimit: 2,
        storageLimit: 1,
        supportLevel: "email",
        customFeatures: [],
        restrictions: ["limited_features"],
      },
      PRO: {
        apiCallsLimit: 100,
        mvpGenerationsLimit: 20,
        storageLimit: 10,
        supportLevel: "chat",
        customFeatures: ["advanced_analytics", "priority_support"],
        restrictions: [],
      },
      ENTERPRISE: {
        apiCallsLimit: 1000,
        mvpGenerationsLimit: 100,
        storageLimit: 100,
        supportLevel: "priority",
        customFeatures: ["custom_integrations", "dedicated_support", "advanced_security"],
        restrictions: [],
      },
      CUSTOM: {
        apiCallsLimit: 500,
        mvpGenerationsLimit: 50,
        storageLimit: 50,
        supportLevel: "priority",
        customFeatures: ["custom_features"],
        restrictions: [],
      },
    };

    // Define pricing based on plan type in INR (Indian Rupees)
    const defaultPricing = {
      FREE: { amount: 0, currency: "INR", billingInterval: "FREE" as const, intervalCount: 1 },
      PRO: { amount: 250000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹2500
      ENTERPRISE: { amount: 1000000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹10000
      CUSTOM: { amount: 500000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹5000
    };

    const pricing = {
      ...defaultPricing[args.planType],
      ...(args.pricing || {}),
      intervalCount: args.pricing?.intervalCount || defaultPricing[args.planType].intervalCount,
    };
    const features = planFeatures[args.planType];
    const planId = args.planId || args.planType.toLowerCase();
    const planName = args.planType === "CUSTOM" ? "Custom Plan" : `${args.planType} Plan`;

    // Setup trial information
    const isTrialActive = args.startTrial && args.planType !== "FREE";
    const trialDays = args.trialDays || 14;
    const trialEndDate = isTrialActive ? now + (trialDays * 24 * 60 * 60 * 1000) : undefined;

    // Calculate billing period
    const periodDuration = pricing.billingInterval === "FREE" ? 30 * 24 * 60 * 60 * 1000 : // 30 days for free
                          pricing.billingInterval === "MONTHLY" ? 30 * 24 * 60 * 60 * 1000 :
                          pricing.billingInterval === "YEARLY" ? 365 * 24 * 60 * 60 * 1000 :
                          pricing.billingInterval === "LIFETIME" ? 365 * 24 * 60 * 60 * 1000 :
                          30 * 24 * 60 * 60 * 1000; // Default to monthly

    const periodStart = now;
    const periodEnd = now + periodDuration;
    const nextBillingDate = pricing.billingInterval === "FREE" || pricing.billingInterval === "LIFETIME" ? undefined : periodEnd;

    // Create subscription
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      userEmail: user.email,
      userName: user.name,
      
      planId,
      planName,
      planType: args.planType,
      
      pricing,
      
      status: isTrialActive ? "TRIALING" : "ACTIVE",
      
      billingInfo: {
        customerId: args.billingInfo?.customerId,
        subscriptionId: args.billingInfo?.subscriptionId,
        paymentMethodId: args.billingInfo?.paymentMethodId,
        lastPaymentDate: args.planType === "FREE" ? undefined : now,
        nextBillingDate,
      },
      
      features,
      
      currentUsage: {
        apiCallsUsed: 0,
        mvpGenerationsUsed: 0,
        storageUsed: 0,
        periodStart,
        periodEnd,
        lastResetDate: now,
      },
      
      trial: isTrialActive ? {
        isTrialActive: true,
        trialStartDate: now,
        trialEndDate,
        trialDaysRemaining: trialDays,
        hasUsedTrial: true,
      } : {
        isTrialActive: false,
        hasUsedTrial: false,
      },
      
      startDate: now,
      
      metadata: {
        source: args.metadata?.source || "web",
        referralCode: args.metadata?.referralCode,
        promotionCode: args.metadata?.promotionCode,
      },
      
      isActive: true,
      autoRenew: args.planType !== "FREE",
      
      createdAt: now,
      updatedAt: now,
    });

    // Update user's subscription field for backward compatibility
    const userSubscriptionValue = args.planType === "CUSTOM" ? "PRO" : args.planType;
    await ctx.db.patch(args.userId, {
      subscription: userSubscriptionValue,
      apiCallLimit: features.apiCallsLimit,
      updatedAt: now,
    });

    // Log subscription creation in history
    await ctx.db.insert("subscriptionHistory", {
      userId: args.userId,
      subscriptionId,
      changeType: "CREATED",
      newPlan: planId,
      newStatus: isTrialActive ? "TRIALING" : "ACTIVE",
      automaticChange: false,
      amountCharged: args.planType === "FREE" ? 0 : pricing.amount,
      effectiveDate: now,
      createdAt: now,
      notes: `Subscription created for ${planName}`,
    });

    return subscriptionId;
  },
});

// Get user's current active subscription
export const getUserSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .first();
    
    return subscription;
  },
});

// Get all subscriptions for a user
export const getUserSubscriptions = query({
  args: { 
    userId: v.id("users"),
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (!args.includeInactive) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const subscriptions = await query
      .order("desc")
      .take(args.limit || 20);
    
    return subscriptions;
  },
});

// Update subscription usage
export const updateSubscriptionUsage = mutation({
  args: {
    userId: v.id("users"),
    usageType: v.union(v.literal("API_CALL"), v.literal("MVP_GENERATION"), v.literal("STORAGE")),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .first();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    const amount = args.amount || 1;
    const updatedUsage = { ...subscription.currentUsage };

    // Check if we need to reset usage (new billing period)
    if (now > subscription.currentUsage.periodEnd) {
      const periodDuration = subscription.pricing.billingInterval === "MONTHLY" ? 30 * 24 * 60 * 60 * 1000 :
                            subscription.pricing.billingInterval === "YEARLY" ? 365 * 24 * 60 * 60 * 1000 :
                            30 * 24 * 60 * 60 * 1000; // Default to monthly
      
      updatedUsage.apiCallsUsed = 0;
      updatedUsage.mvpGenerationsUsed = 0;
      updatedUsage.storageUsed = 0;
      updatedUsage.periodStart = now;
      updatedUsage.periodEnd = now + periodDuration;
      updatedUsage.lastResetDate = now;
    }

    // Update specific usage
    switch (args.usageType) {
      case "API_CALL":
        updatedUsage.apiCallsUsed += amount;
        break;
      case "MVP_GENERATION":
        updatedUsage.mvpGenerationsUsed += amount;
        break;
      case "STORAGE":
        updatedUsage.storageUsed += amount;
        break;
    }

    // Check limits
    const isOverLimit = 
      updatedUsage.apiCallsUsed > subscription.features.apiCallsLimit ||
      updatedUsage.mvpGenerationsUsed > subscription.features.mvpGenerationsLimit ||
      updatedUsage.storageUsed > subscription.features.storageLimit;

    await ctx.db.patch(subscription._id, {
      currentUsage: updatedUsage,
      updatedAt: now,
    });

    return {
      success: true,
      overLimit: isOverLimit,
      currentUsage: updatedUsage,
      limits: subscription.features,
    };
  },
});

// Upgrade/downgrade subscription
export const changeSubscriptionPlan = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    newPlanType: v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE"), v.literal("CUSTOM")),
    reason: v.optional(v.string()),
    prorationAmount: v.optional(v.number()),
    changedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const oldPlanType = subscription.planType;
    const isUpgrade = ["FREE", "PRO", "ENTERPRISE"].indexOf(args.newPlanType) > 
                     ["FREE", "PRO", "ENTERPRISE"].indexOf(oldPlanType);

    // Define new plan features and pricing
    const planFeatures = {
      FREE: {
        apiCallsLimit: 10,
        mvpGenerationsLimit: 2,
        storageLimit: 1,
        supportLevel: "email",
        customFeatures: [],
        restrictions: ["limited_features"],
      },
      PRO: {
        apiCallsLimit: 100,
        mvpGenerationsLimit: 20,
        storageLimit: 10,
        supportLevel: "chat",
        customFeatures: ["advanced_analytics", "priority_support"],
        restrictions: [],
      },
      ENTERPRISE: {
        apiCallsLimit: 1000,
        mvpGenerationsLimit: 100,
        storageLimit: 100,
        supportLevel: "priority",
        customFeatures: ["custom_integrations", "dedicated_support", "advanced_security"],
        restrictions: [],
      },
      CUSTOM: {
        apiCallsLimit: 500,
        mvpGenerationsLimit: 50,
        storageLimit: 50,
        supportLevel: "priority",
        customFeatures: ["custom_features"],
        restrictions: [],
      },
    };

    const defaultPricing = {
      FREE: { amount: 0, currency: "INR", billingInterval: "FREE" as const, intervalCount: 1 },
      PRO: { amount: 250000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹2500
      ENTERPRISE: { amount: 1000000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹10000
      CUSTOM: { amount: 500000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹5000
    };

    const newFeatures = planFeatures[args.newPlanType];
    const newPricing = defaultPricing[args.newPlanType];
    const newPlanId = args.newPlanType.toLowerCase();
    const newPlanName = args.newPlanType === "CUSTOM" ? "Custom Plan" : `${args.newPlanType} Plan`;

    // Update subscription
    await ctx.db.patch(args.subscriptionId, {
      planId: newPlanId,
      planName: newPlanName,
      planType: args.newPlanType,
      pricing: newPricing,
      features: newFeatures,
      autoRenew: args.newPlanType !== "FREE",
      updatedAt: now,
    });

    // Update user's subscription field for backward compatibility
    const userSubscriptionValue = args.newPlanType === "CUSTOM" ? "PRO" : args.newPlanType;
    await ctx.db.patch(subscription.userId, {
      subscription: userSubscriptionValue,
      apiCallLimit: newFeatures.apiCallsLimit,
      updatedAt: now,
    });

    // Log the change in history
    await ctx.db.insert("subscriptionHistory", {
      userId: subscription.userId,
      subscriptionId: args.subscriptionId,
      changeType: isUpgrade ? "UPGRADED" : "DOWNGRADED",
      previousPlan: subscription.planId,
      newPlan: newPlanId,
      previousStatus: subscription.status,
      newStatus: subscription.status,
      reason: args.reason,
      changedBy: args.changedBy,
      automaticChange: false,
      amountCharged: newPricing.amount,
      prorationAmount: args.prorationAmount,
      effectiveDate: now,
      createdAt: now,
      notes: `Plan changed from ${subscription.planName} to ${newPlanName}`,
    });

    return {
      success: true,
      oldPlan: subscription.planType,
      newPlan: args.newPlanType,
      isUpgrade,
    };
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    reason: v.optional(v.string()),
    immediate: v.optional(v.boolean()),
    canceledBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const endDate = args.immediate ? now : subscription.currentUsage.periodEnd;

    await ctx.db.patch(args.subscriptionId, {
      status: "CANCELED",
      isActive: args.immediate,
      autoRenew: false,
      cancelDate: now,
      endDate: endDate,
      updatedAt: now,
      notes: args.reason,
    });

    // If immediate cancellation, update user to FREE plan
    if (args.immediate) {
      await ctx.db.patch(subscription.userId, {
        subscription: "FREE",
        apiCallLimit: 10,
        updatedAt: now,
      });
    }

    // Log cancellation in history
    await ctx.db.insert("subscriptionHistory", {
      userId: subscription.userId,
      subscriptionId: args.subscriptionId,
      changeType: "CANCELED",
      previousStatus: subscription.status,
      newStatus: "CANCELED",
      reason: args.reason,
      changedBy: args.canceledBy,
      automaticChange: false,
      effectiveDate: endDate,
      createdAt: now,
      notes: args.immediate ? "Immediate cancellation" : "Scheduled cancellation at period end",
    });

    return {
      success: true,
      immediate: args.immediate,
      endDate: endDate,
    };
  },
});

// Get subscription analytics
export const getSubscriptionAnalytics = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    planType: v.optional(v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE"), v.literal("CUSTOM"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || now;

    let subscriptions;
    
    if (args.planType) {
      subscriptions = await ctx.db
        .query("subscriptions")
        .withIndex("by_plan_type", (q) => q.eq("planType", args.planType!))
        .filter((q) => 
          q.and(
            q.gte(q.field("createdAt"), startDate),
            q.lte(q.field("createdAt"), endDate)
          )
        )
        .collect();
    } else {
      subscriptions = await ctx.db
        .query("subscriptions")
        .filter((q) => 
          q.and(
            q.gte(q.field("createdAt"), startDate),
            q.lte(q.field("createdAt"), endDate)
          )
        )
        .collect();
    }

    // Calculate analytics
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.isActive).length;
    const trialSubscriptions = subscriptions.filter(s => s.trial?.isTrialActive).length;

    const subscriptionsByPlan = subscriptions.reduce((acc, sub) => {
      acc[sub.planType] = (acc[sub.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const subscriptionsByStatus = subscriptions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = subscriptions
      .filter(s => s.pricing.amount > 0)
      .reduce((sum, s) => sum + s.pricing.amount, 0);

    const averageRevenuePerUser = totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0;

    // Calculate churn rate (canceled subscriptions / total subscriptions)
    const canceledSubscriptions = subscriptions.filter(s => s.status === "CANCELED").length;
    const churnRate = totalSubscriptions > 0 ? (canceledSubscriptions / totalSubscriptions) * 100 : 0;

    return {
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      canceledSubscriptions,
      subscriptionsByPlan,
      subscriptionsByStatus,
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      averageRevenuePerUser: averageRevenuePerUser / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      dateRange: { startDate, endDate },
    };
  },
});

// Get subscription history for a user
export const getSubscriptionHistory = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("subscriptionHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);
    
    return history;
  },
});

// Process expired subscriptions (scheduled function)
export const processExpiredSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredSubscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_end_date", (q) => q.lt("endDate", now))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), true),
          q.neq(q.field("status"), "EXPIRED")
        )
      )
      .collect();

    const processedSubscriptions = [];
    
    for (const subscription of expiredSubscriptions) {
      // Move user to FREE plan
      await ctx.db.patch(subscription.userId, {
        subscription: "FREE",
        apiCallLimit: 10,
        updatedAt: now,
      });

      // Update subscription status
      await ctx.db.patch(subscription._id, {
        status: "EXPIRED",
        isActive: false,
        updatedAt: now,
      });

      // Log expiration in history
      await ctx.db.insert("subscriptionHistory", {
        userId: subscription.userId,
        subscriptionId: subscription._id,
        changeType: "EXPIRED",
        previousStatus: subscription.status,
        newStatus: "EXPIRED",
        automaticChange: true,
        effectiveDate: now,
        createdAt: now,
        notes: "Subscription expired",
      });

      processedSubscriptions.push(subscription._id);
    }

    return {
      processedCount: processedSubscriptions.length,
      processedSubscriptions,
    };
  },
});

// Initialize subscriptions from existing user data
export const initializeSubscriptionsFromUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    const createdSubscriptions = [];
    
    for (const user of users) {
      // Check if user already has a subscription
      const existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
        .first();
      
      if (existingSubscription) continue; // Skip if subscription already exists
      
      // Create subscription based on user's current subscription field
      const planType = user.subscription;
      const planFeatures = {
        FREE: {
          apiCallsLimit: 10,
          mvpGenerationsLimit: 2,
          storageLimit: 1,
          supportLevel: "email",
          customFeatures: [],
          restrictions: ["limited_features"],
        },
        PRO: {
          apiCallsLimit: 100,
          mvpGenerationsLimit: 20,
          storageLimit: 10,
          supportLevel: "chat",
          customFeatures: ["advanced_analytics", "priority_support"],
          restrictions: [],
        },
        ENTERPRISE: {
          apiCallsLimit: 1000,
          mvpGenerationsLimit: 100,
          storageLimit: 100,
          supportLevel: "priority",
          customFeatures: ["custom_integrations", "dedicated_support", "advanced_security"],
          restrictions: [],
        },
      };

      const defaultPricing = {
        FREE: { amount: 0, currency: "INR", billingInterval: "FREE" as const, intervalCount: 1 },
        PRO: { amount: 250000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹2500
        ENTERPRISE: { amount: 1000000, currency: "INR", billingInterval: "MONTHLY" as const, intervalCount: 1 }, // ₹10000
      };

      const features = planFeatures[planType];
      const pricing = defaultPricing[planType];
      const planId = planType.toLowerCase();
      const planName = `${planType} Plan`;

      // Calculate billing period
      const periodDuration = pricing.billingInterval === "FREE" ? 30 * 24 * 60 * 60 * 1000 : // 30 days for free
                            pricing.billingInterval === "MONTHLY" ? 30 * 24 * 60 * 60 * 1000 :
                            30 * 24 * 60 * 60 * 1000; // Default to monthly

      const periodStart = user.createdAt;
      const periodEnd = user.createdAt + periodDuration;

      const subscriptionId = await ctx.db.insert("subscriptions", {
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        
        planId,
        planName,
        planType,
        
        pricing,
        
        status: "ACTIVE",
        
        billingInfo: {
          lastPaymentDate: planType === "FREE" ? undefined : user.createdAt,
          nextBillingDate: planType === "FREE" ? undefined : periodEnd,
        },
        
        features,
        
        currentUsage: {
          apiCallsUsed: user.apiCalls || 0,
          mvpGenerationsUsed: 0,
          storageUsed: 0,
          periodStart,
          periodEnd,
          lastResetDate: user.createdAt,
        },
        
        trial: {
          isTrialActive: false,
          hasUsedTrial: false,
        },
        
        startDate: user.createdAt,
        
        metadata: {
          source: "migration",
        },
        
        isActive: true,
        autoRenew: planType !== "FREE",
        
        createdAt: user.createdAt,
        updatedAt: now,
        notes: "Migrated from user subscription field",
      });

      // Log subscription creation in history
      await ctx.db.insert("subscriptionHistory", {
        userId: user._id,
        subscriptionId,
        changeType: "CREATED",
        newPlan: planId,
        newStatus: "ACTIVE",
        automaticChange: true,
        amountCharged: planType === "FREE" ? 0 : pricing.amount,
        effectiveDate: user.createdAt,
        createdAt: now,
        notes: `Subscription migrated from user data for ${planName}`,
      });

      createdSubscriptions.push(subscriptionId);
    }
    
    return {
      migratedCount: createdSubscriptions.length,
      totalUsers: users.length,
      message: `Successfully migrated ${createdSubscriptions.length} subscriptions from user data`,
    };
  },
});

// Upgrade user subscription and record payment
export const upgradeSubscription = mutation({
  args: {
    userId: v.id("users"),
    newPlanType: v.union(v.literal("PRO"), v.literal("ENTERPRISE")),
    paymentMethodType: v.optional(v.string()),
    externalTransactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get user and current subscription
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentSubscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .first();

    // Calculate pricing in INR (Indian Rupees)
    const planPricing = {
      PRO: { amount: 250000, currency: "INR" }, // ₹2500.00 in paise
      ENTERPRISE: { amount: 1000000, currency: "INR" } // ₹10000.00 in paise
    };

    const pricing = planPricing[args.newPlanType];
    const billingPeriodStart = now;
    const billingPeriodEnd = now + (30 * 24 * 60 * 60 * 1000); // 30 days

    // Create new subscription
    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      userEmail: user.email,
      userName: user.name,
      planType: args.newPlanType,
      planId: `${args.newPlanType.toLowerCase()}-monthly`,
      planName: `${args.newPlanType} Plan`,
      pricing: {
        amount: pricing.amount,
        currency: pricing.currency,
        billingInterval: "MONTHLY",
        intervalCount: 1,
      },
      billingInfo: {
        paymentMethodId: args.paymentMethodType,
      },
      status: "ACTIVE",
      isActive: true,
      autoRenew: true,
      startDate: now,
      endDate: billingPeriodEnd,
      features: {
        apiCallsLimit: args.newPlanType === "PRO" ? 10000 : 50000,
        mvpGenerationsLimit: args.newPlanType === "PRO" ? 100 : 500,
        storageLimit: args.newPlanType === "PRO" ? 10 : 100,
        supportLevel: args.newPlanType === "PRO" ? "email" : "priority",
      },
      currentUsage: {
        apiCallsUsed: 0,
        mvpGenerationsUsed: 0,
        storageUsed: 0,
        periodStart: billingPeriodStart,
        periodEnd: billingPeriodEnd,
        lastResetDate: now,
      },
      metadata: {
        source: "dashboard",
      },
      createdAt: now,
      updatedAt: now,
    });

    // Cancel old subscription if exists
    if (currentSubscription) {
      await ctx.db.patch(currentSubscription._id, {
        isActive: false,
        status: "CANCELED",
        cancelDate: now,
        endDate: now,
        updatedAt: now,
      });
    }

    // Record billing transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await ctx.db.insert("billingTransactions", {
      userId: args.userId,
      subscriptionId: subscriptionId,
      transactionId,
      externalTransactionId: args.externalTransactionId,
      type: "PAYMENT",
      amount: pricing.amount,
      currency: pricing.currency,
      netAmount: pricing.amount,
      processingFee: 0,
      taxes: 0,
      paymentMethod: {
        type: args.paymentMethodType || "card",
      },
      status: "SUCCEEDED",
      billingPeriod: {
        start: billingPeriodStart,
        end: billingPeriodEnd,
      },
      description: `Subscription upgrade to ${args.newPlanType}`,
      processedAt: now,
      createdAt: now,
      updatedAt: now,
      notes: `User upgraded from previous plan to ${args.newPlanType}`,
      metadata: JSON.stringify({ upgradeDate: now, previousPlan: currentSubscription?.planType || "FREE" }),
    });

    // Record subscription history
    await ctx.db.insert("subscriptionHistory", {
      userId: args.userId,
      subscriptionId,
      changeType: "UPGRADED",
      previousPlan: currentSubscription?.planType || "FREE",
      newPlan: args.newPlanType,
      previousStatus: currentSubscription?.status || "INACTIVE",
      newStatus: "ACTIVE",
      automaticChange: false,
      amountCharged: pricing.amount,
      effectiveDate: now,
      createdAt: now,
      notes: `User upgraded to ${args.newPlanType} plan`,
    });

    // Update user subscription in users table for quick access
    await ctx.db.patch(args.userId, {
      subscription: args.newPlanType,
      updatedAt: now,
    });

    return {
      subscriptionId,
      transactionId,
      amount: pricing.amount / 100, // Return in rupees
      currency: pricing.currency,
      message: `Successfully upgraded to ${args.newPlanType} plan`,
    };
  },
});
