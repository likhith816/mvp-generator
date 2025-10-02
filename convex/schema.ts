import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()), // Optional for Google OAuth users
    phone: v.optional(v.string()),
    role: v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("SUPERADMIN")),
    subscription: v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE")),
    avatar: v.optional(v.string()),
    apiCalls: v.number(), // Current API calls used
    apiCallLimit: v.number(), // Maximum API calls allowed
    status: v.optional(v.string()),
    googleId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),
  
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    isActive: v.boolean(),
  }).index("by_token", ["token"])
    .index("by_user", ["userId"]),

  apiUsageHistory: defineTable({
    userId: v.id("users"),
    date: v.string(), // Format: YYYY-MM-DD
    calls: v.number(), // Number of API calls made on this date
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  mvpPlans: defineTable({
    userId: v.id("users"),
    ideaPrompt: v.string(),
    marketAnalysis: v.object({
      title: v.string(),
      content: v.string(),
    }),
    techStackAnalysis: v.object({
      title: v.string(),
      content: v.string(),
    }),
    businessAnalysis: v.object({
      title: v.string(),
      content: v.string(),
    }),
    projectScope: v.object({
      title: v.string(),
      content: v.string(),
    }),
    expenditureEstimation: v.object({
      title: v.string(),
      content: v.string(),
    }),
    competitorAnalysis: v.object({
      title: v.string(),
      content: v.string(),
    }),
    projectPreview: v.object({
      title: v.string(),
      content: v.string(),
    }),
    generatedCode: v.optional(v.array(v.object({
      path: v.string(),
      content: v.string(),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  systemSettings: defineTable({
    key: v.string(), // Setting identifier (e.g., "api_rate_limits", "maintenance_mode")
    value: v.string(), // JSON string value for the setting
    description: v.optional(v.string()), // Human-readable description
    category: v.string(), // Category like "API", "SECURITY", "GENERAL"
    isActive: v.boolean(), // Whether the setting is currently active
    createdBy: v.optional(v.id("users")), // Admin who created/modified
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"]),

  userSessions: defineTable({
    // User Information (snapshot for quick access)
    userId: v.id("users"),
    userEmail: v.string(),
    userName: v.string(),
    userRole: v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("SUPERADMIN")),
    userSubscription: v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE")),
    
    // Session Information
    sessionId: v.string(), // Unique session identifier
    sessionToken: v.string(), // Authentication token
    isActive: v.boolean(), // Whether session is currently active
    
    // Device & Browser Information
    deviceInfo: v.object({
      userAgent: v.optional(v.string()),
      browser: v.optional(v.string()),
      browserVersion: v.optional(v.string()),
      os: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      device: v.optional(v.string()), // mobile, desktop, tablet
      platform: v.optional(v.string()),
    }),
    
    // Location & Network Information
    networkInfo: v.object({
      ipAddress: v.optional(v.string()),
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      timezone: v.optional(v.string()),
      isp: v.optional(v.string()),
    }),
    
    // Session Timing
    loginTime: v.number(), // When session started
    lastActivityTime: v.number(), // Last user activity
    logoutTime: v.optional(v.number()), // When session ended (if ended)
    expiresAt: v.number(), // When session expires
    sessionDuration: v.optional(v.number()), // Total session time in milliseconds
    
    // Security Information
    securityInfo: v.object({
      loginMethod: v.optional(v.string()), // email, google, etc.
      failedLoginAttempts: v.optional(v.number()),
      suspiciousActivity: v.optional(v.boolean()),
      twoFactorUsed: v.optional(v.boolean()),
      riskScore: v.optional(v.number()), // Security risk assessment
    }),
    
    // Activity Tracking
    activityStats: v.object({
      apiCallsMade: v.optional(v.number()), // API calls in this session
      pagesVisited: v.optional(v.array(v.string())), // Pages accessed
      featuresUsed: v.optional(v.array(v.string())), // Features accessed
      mvpPlansGenerated: v.optional(v.number()), // MVP plans created in session
      timeSpentMinutes: v.optional(v.number()), // Active time in minutes
    }),
    
    // Session Status
    sessionStatus: v.union(
      v.literal("ACTIVE"), 
      v.literal("EXPIRED"), 
      v.literal("TERMINATED"), 
      v.literal("LOGGED_OUT"),
      v.literal("SUSPICIOUS")
    ),
    
    // Additional Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    notes: v.optional(v.string()), // Admin notes about session
  })
    .index("by_user", ["userId"])
    .index("by_session_id", ["sessionId"])
    .index("by_session_token", ["sessionToken"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_status", ["sessionStatus"])
    .index("by_user_role", ["userId", "userRole"])
    .index("by_subscription", ["userSubscription"])
    .index("by_login_time", ["loginTime"])
    .index("by_last_activity", ["lastActivityTime"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_ip_address", ["networkInfo.ipAddress"]),

  subscriptions: defineTable({
    // User and Plan Information
    userId: v.id("users"),
    userEmail: v.string(), // Snapshot for quick access
    userName: v.string(), // Snapshot for quick access
    
    // Subscription Plan Details
    planId: v.string(), // FREE, PRO, ENTERPRISE, or custom plan ID
    planName: v.string(), // Human-readable plan name
    planType: v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE"), v.literal("CUSTOM")),
    
    // Pricing Information
    pricing: v.object({
      amount: v.number(), // Price in cents (e.g., 2999 for $29.99)
      currency: v.string(), // USD, EUR, etc.
      billingInterval: v.union(v.literal("MONTHLY"), v.literal("YEARLY"), v.literal("LIFETIME"), v.literal("FREE")),
      intervalCount: v.number(), // e.g., 1 for monthly, 12 for yearly
    }),
    
    // Subscription Status and Lifecycle
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("CANCELED"),
      v.literal("EXPIRED"),
      v.literal("PAST_DUE"),
      v.literal("PAUSED"),
      v.literal("TRIALING"),
      v.literal("INCOMPLETE")
    ),
    
    // Billing and Payment Information
    billingInfo: v.object({
      customerId: v.optional(v.string()), // Stripe customer ID, etc.
      subscriptionId: v.optional(v.string()), // External subscription ID
      paymentMethodId: v.optional(v.string()), // Payment method reference
      lastPaymentDate: v.optional(v.number()),
      nextBillingDate: v.optional(v.number()),
      billingAddress: v.optional(v.object({
        line1: v.optional(v.string()),
        line2: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.optional(v.string()),
      })),
    }),
    
    // Plan Features and Limits
    features: v.object({
      apiCallsLimit: v.number(), // Monthly API calls limit
      mvpGenerationsLimit: v.number(), // Monthly MVP generations limit
      storageLimit: v.number(), // Storage limit in GB
      supportLevel: v.string(), // email, chat, priority, etc.
      customFeatures: v.optional(v.array(v.string())), // Additional features
      restrictions: v.optional(v.array(v.string())), // Any feature restrictions
    }),
    
    // Usage Tracking (current period)
    currentUsage: v.object({
      apiCallsUsed: v.number(),
      mvpGenerationsUsed: v.number(),
      storageUsed: v.number(), // In GB
      periodStart: v.number(), // Start of current billing period
      periodEnd: v.number(), // End of current billing period
      lastResetDate: v.number(), // Last time usage was reset
    }),
    
    // Trial Information
    trial: v.optional(v.object({
      isTrialActive: v.boolean(),
      trialStartDate: v.optional(v.number()),
      trialEndDate: v.optional(v.number()),
      trialDaysRemaining: v.optional(v.number()),
      hasUsedTrial: v.boolean(), // Whether user has ever used a trial
    })),
    
    // Subscription Dates
    startDate: v.number(), // When subscription started
    endDate: v.optional(v.number()), // When subscription ends (for canceled/expired)
    cancelDate: v.optional(v.number()), // When user canceled (if applicable)
    pauseDate: v.optional(v.number()), // When subscription was paused
    resumeDate: v.optional(v.number()), // When subscription was resumed
    
    // Discount and Coupon Information
    discount: v.optional(v.object({
      couponCode: v.optional(v.string()),
      discountType: v.optional(v.union(v.literal("PERCENTAGE"), v.literal("FIXED_AMOUNT"))),
      discountValue: v.optional(v.number()), // Percentage or amount in cents
      validUntil: v.optional(v.number()),
      isActive: v.boolean(),
    })),
    
    // Metadata and Notes
    metadata: v.object({
      source: v.optional(v.string()), // How subscription was created (web, mobile, admin)
      referralCode: v.optional(v.string()), // Referral tracking
      promotionCode: v.optional(v.string()), // Promotion tracking
      salesAgent: v.optional(v.string()), // Sales agent (for enterprise)
      contractTerms: v.optional(v.string()), // Special contract terms
    }),
    
    // Administrative Information
    isActive: v.boolean(), // Whether subscription is currently active
    autoRenew: v.boolean(), // Whether to auto-renew
    createdBy: v.optional(v.id("users")), // Admin who created (for manual subscriptions)
    notes: v.optional(v.string()), // Admin notes
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_plan_type", ["planType"])
    .index("by_status", ["status"])
    .index("by_customer_id", ["billingInfo.customerId"])
    .index("by_subscription_id", ["billingInfo.subscriptionId"])
    .index("by_next_billing", ["billingInfo.nextBillingDate"])
    .index("by_end_date", ["endDate"])
    .index("by_trial_status", ["trial.isTrialActive"])
    .index("by_auto_renew", ["autoRenew"])
    .index("by_created_date", ["createdAt"]),

  subscriptionHistory: defineTable({
    // Reference Information
    userId: v.id("users"),
    subscriptionId: v.id("subscriptions"),
    
    // Change Details
    changeType: v.union(
      v.literal("CREATED"),
      v.literal("UPGRADED"),
      v.literal("DOWNGRADED"),
      v.literal("CANCELED"),
      v.literal("RENEWED"),
      v.literal("PAUSED"),
      v.literal("RESUMED"),
      v.literal("EXPIRED"),
      v.literal("PAYMENT_FAILED"),
      v.literal("PAYMENT_SUCCESS"),
      v.literal("TRIAL_STARTED"),
      v.literal("TRIAL_ENDED")
    ),
    
    // Previous and New Values
    previousPlan: v.optional(v.string()),
    newPlan: v.optional(v.string()),
    previousStatus: v.optional(v.string()),
    newStatus: v.optional(v.string()),
    
    // Change Metadata
    reason: v.optional(v.string()), // Reason for change
    changedBy: v.optional(v.id("users")), // Admin who made the change
    automaticChange: v.boolean(), // Whether change was automatic
    
    // Financial Information
    amountCharged: v.optional(v.number()), // Amount charged for this change
    prorationAmount: v.optional(v.number()), // Proration amount
    refundAmount: v.optional(v.number()), // Refund amount (if any)
    
    // External References
    externalTransactionId: v.optional(v.string()), // Payment processor transaction ID
    invoiceId: v.optional(v.string()), // Invoice reference
    
    // Timestamps
    effectiveDate: v.number(), // When the change took effect
    createdAt: v.number(),
    
    // Additional Details
    notes: v.optional(v.string()),
    metadata: v.optional(v.string()), // JSON string for additional data
  })
    .index("by_user", ["userId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_change_type", ["changeType"])
    .index("by_effective_date", ["effectiveDate"])
    .index("by_automatic", ["automaticChange"])
    .index("by_user_date", ["userId", "effectiveDate"]),

  billingTransactions: defineTable({
    // Reference Information
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("subscriptions")),
    
    // Transaction Details
    transactionId: v.string(), // Unique transaction identifier
    externalTransactionId: v.optional(v.string()), // External payment processor ID
    type: v.union(
      v.literal("PAYMENT"),
      v.literal("REFUND"),
      v.literal("CREDIT"),
      v.literal("ADJUSTMENT"),
      v.literal("CHARGEBACK")
    ),
    
    // Amount Information
    amount: v.number(), // Amount in cents
    currency: v.string(),
    amountRefunded: v.optional(v.number()), // Amount refunded (if any)
    netAmount: v.number(), // Net amount after fees
    processingFee: v.optional(v.number()), // Processing fees
    taxes: v.optional(v.number()), // Tax amount
    
    // Payment Method Information
    paymentMethod: v.object({
      type: v.string(), // card, bank_transfer, paypal, etc.
      last4: v.optional(v.string()), // Last 4 digits of card
      brand: v.optional(v.string()), // visa, mastercard, etc.
      expiryMonth: v.optional(v.number()),
      expiryYear: v.optional(v.number()),
      country: v.optional(v.string()),
    }),
    
    // Transaction Status
    status: v.union(
      v.literal("PENDING"),
      v.literal("SUCCEEDED"),
      v.literal("FAILED"),
      v.literal("CANCELED"),
      v.literal("REFUNDED"),
      v.literal("DISPUTED")
    ),
    
    // Billing Period
    billingPeriod: v.object({
      start: v.number(),
      end: v.number(),
    }),
    
    // Transaction Metadata
    description: v.optional(v.string()),
    invoiceNumber: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    failureReason: v.optional(v.string()), // If transaction failed
    
    // Timestamps
    processedAt: v.optional(v.number()), // When payment was processed
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Additional Information
    notes: v.optional(v.string()),
    metadata: v.optional(v.string()), // JSON string for additional data
  })
    .index("by_user", ["userId"])
    .index("by_subscription", ["subscriptionId"])
    .index("by_transaction_id", ["transactionId"])
    .index("by_external_id", ["externalTransactionId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_processed_date", ["processedAt"])
    .index("by_billing_period", ["billingPeriod.start"]),

  adminAuditLogs: defineTable({
    adminId: v.id("users"),
    adminName: v.string(),
    adminEmail: v.string(),
    adminRole: v.union(v.literal("ADMIN"), v.literal("SUPERADMIN")),
    action: v.string(), // e.g., "USER_DELETED", "USER_STATUS_CHANGED"
    targetId: v.optional(v.string()), // ID of affected resource
    targetType: v.optional(v.string()), // e.g., "USER", "SESSION", "PLAN"
    details: v.optional(v.string()), // JSON string with action details
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_admin", ["adminId"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"])
    .index("by_target_type", ["targetType"])
    .index("by_admin_action", ["adminId", "action"]),
});