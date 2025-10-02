import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new user session
export const createUserSession = mutation({
  args: {
    userId: v.id("users"),
    sessionToken: v.string(),
    sessionId: v.optional(v.string()),
    deviceInfo: v.optional(v.object({
      userAgent: v.optional(v.string()),
      browser: v.optional(v.string()),
      browserVersion: v.optional(v.string()),
      os: v.optional(v.string()),
      osVersion: v.optional(v.string()),
      device: v.optional(v.string()),
      platform: v.optional(v.string()),
    })),
    networkInfo: v.optional(v.object({
      ipAddress: v.optional(v.string()),
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      timezone: v.optional(v.string()),
      isp: v.optional(v.string()),
    })),
    securityInfo: v.optional(v.object({
      loginMethod: v.optional(v.string()),
      twoFactorUsed: v.optional(v.boolean()),
      riskScore: v.optional(v.number()),
    })),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get user details for snapshot
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate session ID if not provided
    const sessionId = args.sessionId || `session_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set default expiry (24 hours from now)
    const expiresAt = args.expiresAt || (now + 24 * 60 * 60 * 1000);

    // Deactivate any existing active sessions for this user
    const existingActiveSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_user_active", (q) => q.eq("userId", args.userId).eq("isActive", true))
      .collect();

    for (const session of existingActiveSessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        sessionStatus: "TERMINATED",
        logoutTime: now,
        sessionDuration: now - session.loginTime,
        updatedAt: now,
      });
    }

    // Create new session
    const sessionId_new = await ctx.db.insert("userSessions", {
      userId: args.userId,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      userSubscription: user.subscription,
      
      sessionId,
      sessionToken: args.sessionToken,
      isActive: true,
      
      deviceInfo: args.deviceInfo || {
        userAgent: undefined,
        browser: undefined,
        browserVersion: undefined,
        os: undefined,
        osVersion: undefined,
        device: undefined,
        platform: undefined,
      },
      
      networkInfo: args.networkInfo || {
        ipAddress: undefined,
        country: undefined,
        city: undefined,
        timezone: undefined,
        isp: undefined,
      },
      
      loginTime: now,
      lastActivityTime: now,
      expiresAt,
      
      securityInfo: {
        loginMethod: args.securityInfo?.loginMethod,
        failedLoginAttempts: 0,
        suspiciousActivity: false,
        twoFactorUsed: args.securityInfo?.twoFactorUsed || false,
        riskScore: args.securityInfo?.riskScore || 0,
      },
      
      activityStats: {
        apiCallsMade: 0,
        pagesVisited: [],
        featuresUsed: [],
        mvpPlansGenerated: 0,
        timeSpentMinutes: 0,
      },
      
      sessionStatus: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    });

    return sessionId_new;
  },
});

// Update session activity
export const updateSessionActivity = mutation({
  args: {
    sessionId: v.string(),
    activityData: v.optional(v.object({
      pageVisited: v.optional(v.string()),
      featureUsed: v.optional(v.string()),
      apiCallMade: v.optional(v.boolean()),
      mvpPlanGenerated: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session || !session.isActive) {
      throw new Error("Session not found or inactive");
    }

    // Calculate time spent
    const timeSpentMinutes = Math.floor((now - session.lastActivityTime) / (1000 * 60));
    
    // Update activity stats
    const updatedStats = { ...session.activityStats };
    
    if (args.activityData?.pageVisited) {
      updatedStats.pagesVisited = [
        ...(updatedStats.pagesVisited || []),
        args.activityData.pageVisited
      ].slice(-50); // Keep last 50 pages
    }
    
    if (args.activityData?.featureUsed) {
      updatedStats.featuresUsed = [
        ...(updatedStats.featuresUsed || []),
        args.activityData.featureUsed
      ].slice(-100); // Keep last 100 features
    }
    
    if (args.activityData?.apiCallMade) {
      updatedStats.apiCallsMade = (updatedStats.apiCallsMade || 0) + 1;
    }
    
    if (args.activityData?.mvpPlanGenerated) {
      updatedStats.mvpPlansGenerated = (updatedStats.mvpPlansGenerated || 0) + 1;
    }

    updatedStats.timeSpentMinutes = (updatedStats.timeSpentMinutes || 0) + timeSpentMinutes;

    await ctx.db.patch(session._id, {
      lastActivityTime: now,
      activityStats: updatedStats,
      updatedAt: now,
    });

    return session._id;
  },
});

// End a user session
export const endUserSession = mutation({
  args: {
    sessionId: v.string(),
    logoutReason: v.optional(v.union(
      v.literal("USER_LOGOUT"),
      v.literal("TIMEOUT"),
      v.literal("ADMIN_TERMINATE"),
      v.literal("SECURITY_BREACH")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    const sessionDuration = now - session.loginTime;
    
    await ctx.db.patch(session._id, {
      isActive: false,
      logoutTime: now,
      sessionDuration,
      sessionStatus: args.logoutReason === "SECURITY_BREACH" ? "SUSPICIOUS" : "LOGGED_OUT",
      updatedAt: now,
      notes: args.logoutReason ? `Session ended: ${args.logoutReason}` : undefined,
    });

    return session._id;
  },
});

// Get user session by session ID
export const getUserSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    
    return session;
  },
});

// Get user session by token
export const getUserSessionByToken = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    
    return session;
  },
});

// Get all sessions for a user
export const getUserSessions = query({
  args: { 
    userId: v.id("users"),
    includeInactive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("userSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (!args.includeInactive) {
      query = query.filter((q) => q.eq(q.field("isActive"), true));
    }

    const sessions = await query
      .order("desc")
      .take(args.limit || 50);
    
    return sessions;
  },
});

// Get active sessions for all users (admin view)
export const getActiveSessions = query({
  args: {
    userRole: v.optional(v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("SUPERADMIN"))),
    userSubscription: v.optional(v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("userSessions")
      .withIndex("by_status", (q) => q.eq("sessionStatus", "ACTIVE"));

    let sessions = await query.order("desc").take(args.limit || 100);

    // Filter by role if specified
    if (args.userRole) {
      sessions = sessions.filter(session => session.userRole === args.userRole);
    }

    // Filter by subscription if specified
    if (args.userSubscription) {
      sessions = sessions.filter(session => session.userSubscription === args.userSubscription);
    }

    return sessions;
  },
});

// Get session analytics
export const getSessionAnalytics = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const startDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || now;

    let sessions;
    
    if (args.userId) {
      sessions = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .filter((q) => 
          q.and(
            q.gte(q.field("loginTime"), startDate),
            q.lte(q.field("loginTime"), endDate)
          )
        )
        .collect();
    } else {
      sessions = await ctx.db
        .query("userSessions")
        .filter((q) => 
          q.and(
            q.gte(q.field("loginTime"), startDate),
            q.lte(q.field("loginTime"), endDate)
          )
        )
        .collect();
    }

    // Calculate analytics
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isActive).length;
    const totalUsers = new Set(sessions.map(s => s.userId)).size;
    
    const avgSessionDuration = sessions
      .filter(s => s.sessionDuration)
      .reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / sessions.length || 0;

    const usersByRole = sessions.reduce((acc, session) => {
      acc[session.userRole] = (acc[session.userRole] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const usersBySubscription = sessions.reduce((acc, session) => {
      acc[session.userSubscription] = (acc[session.userSubscription] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const deviceStats = sessions.reduce((acc, session) => {
      const device = session.deviceInfo.device || "unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountries = sessions.reduce((acc, session) => {
      const country = session.networkInfo.country || "unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSessions,
      activeSessions,
      totalUsers,
      avgSessionDurationMinutes: Math.round(avgSessionDuration / (1000 * 60)),
      usersByRole,
      usersBySubscription,
      deviceStats,
      topCountries,
      dateRange: { startDate, endDate },
    };
  },
});

// Clean up expired sessions
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_expires_at", (q) => q.lt("expiresAt", now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const updatedSessionIds = [];
    
    for (const session of expiredSessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        sessionStatus: "EXPIRED",
        logoutTime: now,
        sessionDuration: now - session.loginTime,
        updatedAt: now,
      });
      updatedSessionIds.push(session._id);
    }

    return {
      expiredCount: expiredSessions.length,
      updatedSessionIds,
    };
  },
});

// Update session security info
export const updateSessionSecurity = mutation({
  args: {
    sessionId: v.string(),
    securityUpdate: v.object({
      failedLoginAttempts: v.optional(v.number()),
      suspiciousActivity: v.optional(v.boolean()),
      riskScore: v.optional(v.number()),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const session = await ctx.db
      .query("userSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Session not found");
    }

    const updatedSecurityInfo = {
      ...session.securityInfo,
      ...args.securityUpdate,
    };

    // Mark as suspicious if risk score is high
    let sessionStatus = session.sessionStatus;
    if (args.securityUpdate.riskScore && args.securityUpdate.riskScore > 70) {
      sessionStatus = "SUSPICIOUS";
    }

    await ctx.db.patch(session._id, {
      securityInfo: updatedSecurityInfo,
      sessionStatus,
      updatedAt: now,
      notes: args.securityUpdate.notes || session.notes,
    });

    return session._id;
  },
});

// Get suspicious sessions (security monitoring)
export const getSuspiciousSessions = query({
  args: {
    riskThreshold: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const riskThreshold = args.riskThreshold || 50;
    
    const allSessions = await ctx.db
      .query("userSessions")
      .withIndex("by_status", (q) => q.eq("sessionStatus", "ACTIVE"))
      .take(args.limit || 100);

    const suspiciousSessions = allSessions.filter(session => 
      session.securityInfo.suspiciousActivity || 
      (session.securityInfo.riskScore && session.securityInfo.riskScore > riskThreshold) ||
      (session.securityInfo.failedLoginAttempts && session.securityInfo.failedLoginAttempts > 3)
    );

    return suspiciousSessions;
  },
});

// Initialize user sessions from existing sessions table
export const initializeUserSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all existing sessions from the old sessions table
    const oldSessions = await ctx.db.query("sessions").collect();
    
    // Get all users for reference
    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map(user => [user._id, user]));
    
    const migratedSessions = [];
    
    for (const oldSession of oldSessions) {
      const user = userMap.get(oldSession.userId);
      if (!user) continue;
      
      // Check if session already exists in userSessions
      const existingUserSession = await ctx.db
        .query("userSessions")
        .withIndex("by_session_token", (q) => q.eq("sessionToken", oldSession.token))
        .first();
      
      if (existingUserSession) continue; // Skip if already migrated
      
      // Create comprehensive session record
      const sessionId = `migrated_${oldSession._id}_${Date.now()}`;
      
      const userSessionId = await ctx.db.insert("userSessions", {
        userId: oldSession.userId,
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        userSubscription: user.subscription,
        
        sessionId,
        sessionToken: oldSession.token,
        isActive: oldSession.isActive && oldSession.expiresAt > now,
        
        deviceInfo: {
          userAgent: undefined,
          browser: "Unknown",
          browserVersion: undefined,
          os: undefined,
          osVersion: undefined,
          device: "Unknown",
          platform: undefined,
        },
        
        networkInfo: {
          ipAddress: undefined,
          country: undefined,
          city: undefined,
          timezone: undefined,
          isp: undefined,
        },
        
        loginTime: oldSession.createdAt,
        lastActivityTime: oldSession.createdAt,
        logoutTime: oldSession.isActive ? undefined : oldSession.expiresAt,
        expiresAt: oldSession.expiresAt,
        sessionDuration: oldSession.isActive ? undefined : (oldSession.expiresAt - oldSession.createdAt),
        
        securityInfo: {
          loginMethod: "email",
          failedLoginAttempts: 0,
          suspiciousActivity: false,
          twoFactorUsed: false,
          riskScore: 0,
        },
        
        activityStats: {
          apiCallsMade: 0,
          pagesVisited: [],
          featuresUsed: [],
          mvpPlansGenerated: 0,
          timeSpentMinutes: 0,
        },
        
        sessionStatus: oldSession.isActive && oldSession.expiresAt > now ? "ACTIVE" : "EXPIRED",
        createdAt: oldSession.createdAt,
        updatedAt: now,
        notes: "Migrated from legacy sessions table",
      });
      
      migratedSessions.push(userSessionId);
    }
    
    return {
      migratedCount: migratedSessions.length,
      totalOldSessions: oldSessions.length,
      message: `Successfully migrated ${migratedSessions.length} sessions to userSessions table`,
    };
  },
});

// Create sample session data for testing
export const createSampleSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get some users to create sample sessions for
    const users = await ctx.db.query("users").take(5);
    
    if (users.length === 0) {
      throw new Error("No users found. Please create users first.");
    }
    
    const sampleSessions = [];
    
    for (const user of users) {
      // Create 1-3 sample sessions per user
      const sessionCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < sessionCount; i++) {
        const sessionAge = Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000); // Random session up to 7 days old
        const loginTime = now - sessionAge;
        const isActive = Math.random() > 0.3; // 70% chance of active session
        
        const sessionId = `sample_${user._id}_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const sessionToken = `token_${sessionId}`;
        
        const sampleDevices = ["desktop", "mobile", "tablet"];
        const sampleBrowsers = ["Chrome", "Firefox", "Safari", "Edge"];
        const sampleOS = ["Windows", "macOS", "Linux", "iOS", "Android"];
        const sampleCountries = ["United States", "United Kingdom", "Canada", "Germany", "Japan"];
        
        const userSessionId = await ctx.db.insert("userSessions", {
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
          userSubscription: user.subscription,
          
          sessionId,
          sessionToken,
          isActive,
          
          deviceInfo: {
            userAgent: `Mozilla/5.0 (Sample User Agent)`,
            browser: sampleBrowsers[Math.floor(Math.random() * sampleBrowsers.length)],
            browserVersion: `${Math.floor(Math.random() * 50) + 50}.0`,
            os: sampleOS[Math.floor(Math.random() * sampleOS.length)],
            osVersion: "10.0",
            device: sampleDevices[Math.floor(Math.random() * sampleDevices.length)],
            platform: "x64",
          },
          
          networkInfo: {
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            country: sampleCountries[Math.floor(Math.random() * sampleCountries.length)],
            city: "Sample City",
            timezone: "UTC-5",
            isp: "Sample ISP",
          },
          
          loginTime,
          lastActivityTime: loginTime + Math.floor(Math.random() * sessionAge),
          logoutTime: isActive ? undefined : (loginTime + sessionAge),
          expiresAt: loginTime + 24 * 60 * 60 * 1000, // 24 hours from login
          sessionDuration: isActive ? undefined : sessionAge,
          
          securityInfo: {
            loginMethod: Math.random() > 0.5 ? "email" : "google",
            failedLoginAttempts: Math.floor(Math.random() * 3),
            suspiciousActivity: Math.random() > 0.9, // 10% chance of suspicious activity
            twoFactorUsed: Math.random() > 0.7, // 30% use 2FA
            riskScore: Math.floor(Math.random() * 100),
          },
          
          activityStats: {
            apiCallsMade: Math.floor(Math.random() * 50),
            pagesVisited: ["/dashboard", "/mvp-generator", "/profile", "/settings"].slice(0, Math.floor(Math.random() * 4) + 1),
            featuresUsed: ["mvp-generation", "api-usage", "profile-edit"].slice(0, Math.floor(Math.random() * 3) + 1),
            mvpPlansGenerated: Math.floor(Math.random() * 5),
            timeSpentMinutes: Math.floor(Math.random() * 180), // 0-3 hours
          },
          
          sessionStatus: isActive ? "ACTIVE" : (Math.random() > 0.8 ? "EXPIRED" : "LOGGED_OUT"),
          createdAt: loginTime,
          updatedAt: now,
          notes: `Sample session for testing purposes`,
        });
        
        sampleSessions.push(userSessionId);
      }
    }
    
    return {
      createdCount: sampleSessions.length,
      usersWithSessions: users.length,
      message: `Created ${sampleSessions.length} sample sessions for ${users.length} users`,
    };
  },
});

// Get all sessions with user info for admin dashboard
export const getSessionsForAdmin = query({
  args: {
    limit: v.optional(v.number()),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const includeInactive = args.includeInactive ?? true;

    // Get sessions
    let sessions;
    
    if (includeInactive) {
      sessions = await ctx.db
        .query("userSessions")
        .order("desc")
        .take(limit);
    } else {
      sessions = await ctx.db
        .query("userSessions")
        .filter((q) => q.eq(q.field("isActive"), true))
        .order("desc")
        .take(limit);
    }

    // Get user info for each session
    const sessionsWithUserInfo = await Promise.all(
      sessions.map(async (session) => {
        const user = await ctx.db.get(session.userId);
        return {
          id: session._id,
          userName: user ? `${user.name}${user.role !== 'USER' ? ` (${user.role})` : ''}` : 'Unknown User',
          loginTime: new Date(session.loginTime).toLocaleString(),
          actions: (session.activityStats?.apiCallsMade || 0) + 
                   (session.activityStats?.mvpPlansGenerated || 0) + 
                   (session.activityStats?.featuresUsed?.length || 0),
          status: session.sessionStatus,
          userRole: session.userRole,
          sessionDuration: session.sessionDuration,
          pagesVisited: session.activityStats?.pagesVisited?.length || 0,
          featuresUsed: session.activityStats?.featuresUsed?.length || 0,
          isActive: session.isActive,
        };
      })
    );

    return sessionsWithUserInfo;
  },
});