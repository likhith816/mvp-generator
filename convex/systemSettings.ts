import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get a specific system setting by key
export const getSystemSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!setting) {
      return null;
    }
    
    try {
      return {
        ...setting,
        value: JSON.parse(setting.value)
      };
    } catch {
      return {
        ...setting,
        value: setting.value
      };
    }
  },
});

// Get all system settings by category
export const getSystemSettingsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("systemSettings")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return settings.map(setting => {
      try {
        return {
          ...setting,
          value: JSON.parse(setting.value)
        };
      } catch {
        return {
          ...setting,
          value: setting.value
        };
      }
    });
  },
});

// Get all system settings (admin only)
export const getAllSystemSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("systemSettings")
      .collect();
    
    return settings.map(setting => {
      try {
        return {
          ...setting,
          value: JSON.parse(setting.value)
        };
      } catch {
        return {
          ...setting,
          value: setting.value
        };
      }
    });
  },
});

// Create or update a system setting
export const setSystemSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    category: v.string(),
    createdBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const valueStr = typeof args.value === 'string' ? args.value : JSON.stringify(args.value);
    
    // Check if setting already exists
    const existingSetting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    if (existingSetting) {
      // Update existing setting
      await ctx.db.patch(existingSetting._id, {
        value: valueStr,
        description: args.description,
        category: args.category,
        updatedAt: now,
      });
      return existingSetting._id;
    } else {
      // Create new setting
      const settingId = await ctx.db.insert("systemSettings", {
        key: args.key,
        value: valueStr,
        description: args.description || "",
        category: args.category,
        isActive: true,
        createdBy: args.createdBy,
        createdAt: now,
        updatedAt: now,
      });
      return settingId;
    }
  },
});

// Toggle setting active status
export const toggleSystemSetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    if (!setting) {
      throw new Error("Setting not found");
    }
    
    await ctx.db.patch(setting._id, {
      isActive: !setting.isActive,
      updatedAt: Date.now(),
    });
    
    return !setting.isActive;
  },
});

// Delete a system setting
export const deleteSystemSetting = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    
    if (!setting) {
      throw new Error("Setting not found");
    }
    
    await ctx.db.delete(setting._id);
    return true;
  },
});

// Initialize default system settings
export const initializeSystemSettings = mutation({
  args: { adminUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const defaultSettings = [
      {
        key: "api_rate_limit_free",
        value: JSON.stringify({ limit: 10, period: "daily" }),
        description: "API rate limit for free tier users",
        category: "API",
      },
      {
        key: "api_rate_limit_pro",
        value: JSON.stringify({ limit: 100, period: "daily" }),
        description: "API rate limit for pro tier users",
        category: "API",
      },
      {
        key: "api_rate_limit_enterprise",
        value: JSON.stringify({ limit: 1000, period: "daily" }),
        description: "API rate limit for enterprise tier users",
        category: "API",
      },
      {
        key: "maintenance_mode",
        value: JSON.stringify(false),
        description: "Enable/disable maintenance mode",
        category: "SYSTEM",
      },
      {
        key: "max_mvp_plans_per_user",
        value: JSON.stringify({ free: 5, pro: 50, enterprise: 1000 }),
        description: "Maximum MVP plans per user by subscription tier",
        category: "FEATURES",
      },
      {
        key: "gemini_api_settings",
        value: JSON.stringify({
          model: "gemini-1.5-flash",
          temperature: 0.7,
          maxTokens: 8192
        }),
        description: "Gemini AI API configuration",
        category: "AI",
      },
      {
        key: "session_timeout",
        value: JSON.stringify({ duration: 86400000 }), // 24 hours in ms
        description: "User session timeout duration",
        category: "SECURITY",
      },
      {
        key: "email_notifications",
        value: JSON.stringify({
          enabled: true,
          smtp: {
            host: "",
            port: 587,
            secure: false
          }
        }),
        description: "Email notification settings",
        category: "NOTIFICATIONS",
      }
    ];
    
    const results = [];
    
    for (const setting of defaultSettings) {
      // Check if setting already exists
      const existing = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();
      
      if (!existing) {
        const settingId = await ctx.db.insert("systemSettings", {
          ...setting,
          isActive: true,
          createdBy: args.adminUserId,
          createdAt: now,
          updatedAt: now,
        });
        results.push({ key: setting.key, id: settingId, created: true });
      } else {
        results.push({ key: setting.key, id: existing._id, created: false });
      }
    }
    
    return {
      message: "System settings initialization completed",
      results,
      totalSettings: results.length,
      newSettings: results.filter(r => r.created).length,
    };
  },
});

// Get API rate limits for a subscription tier
export const getApiRateLimit = query({
  args: { subscription: v.string() },
  handler: async (ctx, args) => {
    const settingKey = `api_rate_limit_${args.subscription.toLowerCase()}`;
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", settingKey))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (!setting) {
      // Return default limits if no setting found
      const defaults = {
        free: { limit: 10, period: "daily" },
        pro: { limit: 100, period: "daily" },
        enterprise: { limit: 1000, period: "daily" }
      };
      const key = args.subscription.toLowerCase() as keyof typeof defaults;
      return defaults[key] || defaults.free;
    }
    
    try {
      return JSON.parse(setting.value);
    } catch {
      return { limit: 10, period: "daily" };
    }
  },
});