import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Create a new session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    deviceInfo: v.optional(v.object({
      userAgent: v.optional(v.string()),
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
      device: v.optional(v.string()),
    })),
    networkInfo: v.optional(v.object({
      ipAddress: v.optional(v.string()),
      country: v.optional(v.string()),
      city: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Get user details
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Deactivate any existing active sessions for this user
    const existingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of existingSessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    // Deactivate any existing active userSessions for this user
    const existingUserSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .collect();

    for (const session of existingUserSessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        sessionStatus: "TERMINATED",
        logoutTime: Date.now(),
        sessionDuration: Date.now() - session.loginTime,
        updatedAt: Date.now(),
      });
    }

    // Create new session
    const sessionId = await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
      isActive: true,
    });

    // Create detailed userSession for tracking
    const now = Date.now();
    const userSessionId = await ctx.db.insert("userSessions", {
      userId: args.userId,
      sessionToken: args.token,
      sessionId: sessionId,
      loginTime: now,
      isActive: true,
      lastActivityTime: now,
      
      // User snapshot
      userRole: user.role,
      userSubscription: user.subscription,
      userName: user.name,
      userEmail: user.email,
      
      // Device and network info
      deviceInfo: args.deviceInfo || {},
      networkInfo: args.networkInfo || {},
      
      // Security info
      securityInfo: {
        loginMethod: "password",
        twoFactorUsed: false,
        riskScore: 0,
        suspiciousActivity: false,
      },
      
      // Activity tracking
      activityStats: {
        apiCallsMade: 0,
        pagesVisited: [],
        featuresUsed: [],
        mvpPlansGenerated: 0,
        timeSpentMinutes: 0,
      },
      
      sessionStatus: "ACTIVE",
      expiresAt: args.expiresAt,
      createdAt: now,
      updatedAt: now,
      notes: user.role === "ADMIN" || user.role === "SUPERADMIN" ? "Admin session created" : "User session created",
    });

    return sessionId;
  },
});

// Get session by token
export const getSessionByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return { expired: true };
    }

    return session;
  },
});

// Get user by session token (includes user data)
export const getUserBySessionToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      return { expired: true };
    }

    // Get user data
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        subscription: user.subscription,
        apiCalls: user.apiCalls || 0,
        apiCallLimit: user.apiCallLimit || 5,
        hasPassword: !!user.password, // Boolean to indicate if user has password
        // Don't return password for security
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      }
    };
  },
});

// Invalidate session (logout)
export const invalidateSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { success: true };
  },
});

// Invalidate expired session
export const invalidateExpiredSession = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session && session.expiresAt < Date.now()) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { success: true };
  },
});

// Invalidate all sessions for a user
export const invalidateAllUserSessions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { success: true };
  },
});

// Clean up expired sessions (utility function)
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredSessions = await ctx.db
      .query("sessions")
      .filter((q) => q.and(
        q.eq(q.field("isActive"), true),
        q.lt(q.field("expiresAt"), now)
      ))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { cleaned: expiredSessions.length };
  },
});