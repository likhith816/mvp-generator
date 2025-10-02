import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Helper function to get API call limit based on subscription
const getApiCallLimit = (subscription: 'FREE' | 'PRO' | 'ENTERPRISE'): number => {
  switch (subscription) {
    case 'FREE':
      return 5;
    case 'PRO':
      return 40;
    case 'ENTERPRISE':
      return 999999;
    default:
      return 5;
  }
};

// Create a new user
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.optional(v.string()),
    role: v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("SUPERADMIN")),
    subscription: v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new ConvexError("User with this email already exists");
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      role: args.role,
      subscription: args.subscription,
      apiCalls: 0, // Initialize API calls to 0
      apiCallLimit: getApiCallLimit(args.subscription), // Set limit based on subscription
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user;
  },
});

// Get all users (for admin dashboard)
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100; // Default limit of 100 users
    const offset = args.offset || 0;  // Default offset of 0

    const users = await ctx.db
      .query("users")
      .order("desc")
      .collect();

    // Return paginated results
    const paginatedUsers = users.slice(offset, offset + limit);
    
    return {
      users: paginatedUsers,
      total: users.length,
      hasMore: offset + limit < users.length,
    };
  },
});

// Update user password
export const updateUserPassword = mutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(args.userId, {
      password: args.newPassword,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatar: v.optional(v.string()),
    status: v.optional(v.string()),
    role: v.optional(v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("SUPERADMIN"))),
    subscription: v.optional(v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE"))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // If email is being updated, check if it's already taken
    if (args.email && args.email !== user.email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();

      if (existingUser) {
        throw new ConvexError("Email is already taken");
      }
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.avatar !== undefined) updateData.avatar = args.avatar;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.role !== undefined) updateData.role = args.role;
    if (args.subscription !== undefined) updateData.subscription = args.subscription;

    await ctx.db.patch(args.userId, updateData);

    return { success: true };
  },
});

// Update user subscription
export const updateUserSubscription = mutation({
  args: {
    userId: v.id("users"),
    subscription: v.union(v.literal("FREE"), v.literal("PRO"), v.literal("ENTERPRISE")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update subscription and API call limit
    await ctx.db.patch(args.userId, {
      subscription: args.subscription,
      apiCallLimit: getApiCallLimit(args.subscription),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete user
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Also delete all sessions for this user
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await ctx.db.delete(args.userId);

    return { success: true };
  },
});

// Increment API calls for a user
export const incrementApiCalls = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const newApiCalls = (user.apiCalls || 0) + 1;

    // Update user's total API call count
    await ctx.db.patch(args.userId, {
      apiCalls: newApiCalls,
      updatedAt: Date.now(),
    });

    // Log the API call for usage history tracking
    const todaysDate = new Date().toISOString().split('T')[0];
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
    } else {
      // Create new record for today
      await ctx.db.insert("apiUsageHistory", {
        userId: args.userId,
        date: todaysDate,
        calls: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { 
      success: true, 
      apiCalls: newApiCalls,
      apiCallLimit: user.apiCallLimit || getApiCallLimit(user.subscription)
    };
  },
});

// Reset API calls for a user (useful for testing or admin actions)
export const resetApiCalls = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(args.userId, {
      apiCalls: 0,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update user API call limit (useful when subscription changes)
export const updateApiCallLimit = mutation({
  args: { 
    userId: v.id("users"),
    newLimit: v.optional(v.number()) // If not provided, will use subscription-based limit
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const apiCallLimit = args.newLimit || getApiCallLimit(user.subscription);

    await ctx.db.patch(args.userId, {
      apiCallLimit,
      updatedAt: Date.now(),
    });

    return { success: true, apiCallLimit };
  },
});