import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Log an admin action
export const logAdminAction = mutation({
  args: {
    adminId: v.id("users"),
    action: v.string(), // e.g., "USER_DELETED", "USER_STATUS_CHANGED", "USER_CREATED"
    targetId: v.optional(v.string()), // ID of the affected resource
    targetType: v.optional(v.string()), // e.g., "USER", "SESSION", "PLAN"
    details: v.optional(v.string()), // JSON string with action details
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get admin details
    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      throw new ConvexError("Admin not found");
    }

    if (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN") {
      throw new ConvexError("User is not an admin");
    }

    const auditLogId = await ctx.db.insert("adminAuditLogs", {
      adminId: args.adminId,
      adminName: admin.name,
      adminEmail: admin.email,
      adminRole: admin.role,
      action: args.action,
      targetId: args.targetId,
      targetType: args.targetType,
      details: args.details,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: now,
      createdAt: now,
    });

    return auditLogId;
  },
});

// Get admin audit logs with filtering
export const getAdminAuditLogs = query({
  args: {
    adminId: v.optional(v.id("users")),
    action: v.optional(v.string()),
    targetType: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const now = Date.now();
    const startDate = args.startDate || (now - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = args.endDate || now;

    let logs;

    // Filter by admin if specified
    if (args.adminId) {
      logs = await ctx.db
        .query("adminAuditLogs")
        .withIndex("by_admin", (q) => q.eq("adminId", args.adminId!))
        .filter((q) => 
          q.and(
            q.gte(q.field("timestamp"), startDate),
            q.lte(q.field("timestamp"), endDate)
          )
        )
        .order("desc")
        .take(limit);
    } else {
      logs = await ctx.db
        .query("adminAuditLogs")
        .filter((q) => 
          q.and(
            q.gte(q.field("timestamp"), startDate),
            q.lte(q.field("timestamp"), endDate)
          )
        )
        .order("desc")
        .take(limit);
    }

    // Additional filtering
    if (args.action) {
      logs = logs.filter(log => log.action.includes(args.action!));
    }

    if (args.targetType) {
      logs = logs.filter(log => log.targetType === args.targetType);
    }

    return logs.map(log => ({
      ...log,
      timestampFormatted: new Date(log.timestamp).toLocaleString(),
    }));
  },
});

// Get audit log statistics
export const getAuditLogStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const now = Date.now();
    const startDate = now - (days * 24 * 60 * 60 * 1000);

    const logs = await ctx.db
      .query("adminAuditLogs")
      .filter((q) => q.gte(q.field("timestamp"), startDate))
      .collect();

    // Group by action type
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by admin
    const adminCounts = logs.reduce((acc, log) => {
      const key = `${log.adminName} (${log.adminRole})`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by day
    const dailyCounts: Record<string, number> = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return {
      totalLogs: logs.length,
      actionCounts,
      adminCounts,
      dailyCounts,
      timeRange: `${days} days`,
    };
  },
});

// Clean up old audit logs (keep only last 90 days)
export const cleanupOldAuditLogs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoffDate = now - (90 * 24 * 60 * 60 * 1000); // 90 days ago

    const oldLogs = await ctx.db
      .query("adminAuditLogs")
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect();

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return { deletedLogs: oldLogs.length };
  },
});