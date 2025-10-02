import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// Login function that validates credentials
export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new ConvexError("User not found. Please check your email or sign up.");
    }

    // Check if user has a password (not Google OAuth user)
    if (!user.password) {
      throw new ConvexError("This account was created with Google. Please sign in with Google.");
    }

    // Validate password (in production, use proper password hashing)
    if (user.password !== args.password) {
      throw new ConvexError("Invalid password. Please check your credentials.");
    }

    return user;
  },
});

// Get user by email for password change operations
export const getUserForPasswordChange = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});

// Check if user exists for Google OAuth
export const checkUserExists = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    return user;
  },
});
