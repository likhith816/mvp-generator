import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Helper function to get today's date in YYYY-MM-DD format
const getTodaysDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper function to get date N days ago in YYYY-MM-DD format
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Log an API call for a user (increments today's count or creates new record)
export const logApiCall = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const todaysDate = getTodaysDate();
    const now = Date.now();

    // Check if there's already a record for today
    const existingRecord = await ctx.db
      .query("apiUsageHistory")
      .withIndex("by_user_date", (q) => 
        q.eq("userId", args.userId).eq("date", todaysDate)
      )
      .first();

    if (existingRecord) {
      // Increment today's count
      await ctx.db.patch(existingRecord._id, {
        calls: existingRecord.calls + 1,
        updatedAt: now,
      });
      return { success: true, date: todaysDate, calls: existingRecord.calls + 1 };
    } else {
      // Create new record for today
      await ctx.db.insert("apiUsageHistory", {
        userId: args.userId,
        date: todaysDate,
        calls: 1,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, date: todaysDate, calls: 1 };
    }
  },
});

// Get API usage history for the last 7 days for a user
export const getApiUsageHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Generate the last 7 days dates
    const last7Days = Array.from({ length: 7 }, (_, i) => getDateDaysAgo(6 - i));
    
    // Get all usage records for this user in the last 7 days
    const usageRecords = await ctx.db
      .query("apiUsageHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          ...last7Days.map(date => q.eq(q.field("date"), date))
        )
      )
      .collect();

    // Create a map for quick lookup
    const usageMap = new Map(usageRecords.map(record => [record.date, record.calls]));

    // Format the data for the chart (last 7 days with 0 for missing days)
    const historyData = last7Days.map(date => {
      // Format date for display (e.g., "2 days ago", "Yesterday", "Today")
      const today = new Date().toISOString().split('T')[0];
      const yesterday = getDateDaysAgo(1);
      
      let displayDate: string;
      if (date === today) {
        displayDate = 'Today';
      } else if (date === yesterday) {
        displayDate = 'Yesterday';
      } else {
        const daysAgo = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        displayDate = `${daysAgo} days ago`;
      }

      return {
        date: displayDate,
        calls: usageMap.get(date) || 0,
        rawDate: date, // Keep raw date for sorting if needed
      };
    });

    return historyData;
  },
});

// Get total API calls for a user in the last 30 days (for analytics)
export const getMonthlyApiUsage = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => getDateDaysAgo(i));
    
    const usageRecords = await ctx.db
      .query("apiUsageHistory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          ...last30Days.map(date => q.eq(q.field("date"), date))
        )
      )
      .collect();

    const totalCalls = usageRecords.reduce((sum, record) => sum + record.calls, 0);
    return { totalCalls, recordCount: usageRecords.length };
  },
});

// Clean up old usage history records (older than 90 days) - utility function
export const cleanupOldUsageHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoffDate = getDateDaysAgo(90);
    
    const oldRecords = await ctx.db
      .query("apiUsageHistory")
      .filter((q) => q.lt(q.field("date"), cutoffDate))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }

    return { deletedRecords: oldRecords.length };
  },
});

// Get system health metrics for admin dashboard
export const getSystemHealthMetrics = query({
  args: {
    hoursBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hoursBack = args.hoursBack || 24; // Default to last 24 hours
    const now = Date.now();
    const startTime = now - (hoursBack * 60 * 60 * 1000);

    // Get all sessions in the time period
    const sessions = await ctx.db
      .query("userSessions")
      .filter((q) => q.gte(q.field("loginTime"), startTime))
      .collect();

    // Get all API usage in the time period
    const apiUsage = await ctx.db.query("apiUsageHistory").collect();

    // Calculate success/failure rates based on sessions and activity
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.isActive).length;
    const suspiciousSessions = sessions.filter(s => 
      s.securityInfo?.suspiciousActivity || s.sessionStatus === "SUSPICIOUS"
    ).length;

    // Create hourly data points for the chart
    const healthDataPoints = [];
    const intervalsCount = Math.min(hoursBack, 12); // Show max 12 data points
    const intervalMinutes = (hoursBack * 60) / intervalsCount;

    for (let i = intervalsCount - 1; i >= 0; i--) {
      const intervalStart = now - (i * intervalMinutes * 60 * 1000);
      const intervalEnd = now - ((i - 1) * intervalMinutes * 60 * 1000);
      
      const intervalSessions = sessions.filter(s => 
        s.loginTime >= intervalStart && s.loginTime < intervalEnd
      );

      const totalInInterval = intervalSessions.length;
      const suspiciousInInterval = intervalSessions.filter(s => 
        s.securityInfo?.suspiciousActivity || s.sessionStatus === "SUSPICIOUS"
      ).length;

      const failureRate = totalInInterval > 0 ? Math.round((suspiciousInInterval / totalInInterval) * 100) : 0;
      const successRate = 100 - failureRate;

      const timeLabel = new Date(intervalStart).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      healthDataPoints.push({
        time: timeLabel,
        failureRate,
        successRate,
      });
    }

    return {
      healthData: healthDataPoints,
      summary: {
        totalSessions,
        activeSessions,
        suspiciousSessions,
        overallSuccessRate: totalSessions > 0 ? Math.round(((totalSessions - suspiciousSessions) / totalSessions) * 100) : 100,
      }
    };
  },
});