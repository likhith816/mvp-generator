import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Create a new MVP plan
export const createMvpPlan = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const planId = await ctx.db.insert("mvpPlans", {
      userId: args.userId,
      ideaPrompt: args.ideaPrompt,
      marketAnalysis: args.marketAnalysis,
      techStackAnalysis: args.techStackAnalysis,
      businessAnalysis: args.businessAnalysis,
      projectScope: args.projectScope,
      expenditureEstimation: args.expenditureEstimation,
      competitorAnalysis: args.competitorAnalysis,
      projectPreview: args.projectPreview,
      generatedCode: args.generatedCode,
      createdAt: now,
      updatedAt: now,
    });

    return planId;
  },
});

// Get all MVP plans for a user (for dashboard display)
export const getUserMvpPlans = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("mvpPlans")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc") // Most recent first
      .collect();

    // Transform to match the frontend MvpPlan interface
    return plans.map(plan => ({
      id: plan._id,
      userId: plan.userId,
      ideaPrompt: plan.ideaPrompt,
      marketAnalysis: plan.marketAnalysis,
      techStackAnalysis: plan.techStackAnalysis,
      businessAnalysis: plan.businessAnalysis,
      projectScope: plan.projectScope,
      expenditureEstimation: plan.expenditureEstimation,
      competitorAnalysis: plan.competitorAnalysis,
      projectPreview: plan.projectPreview,
      generatedCode: plan.generatedCode,
      createdAt: new Date(plan.createdAt).toISOString(),
    }));
  },
});

// Get a specific MVP plan by ID
export const getMvpPlanById = query({
  args: { planId: v.id("mvpPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    
    if (!plan) {
      return null;
    }

    // Transform to match the frontend MvpPlan interface
    return {
      id: plan._id,
      userId: plan.userId,
      ideaPrompt: plan.ideaPrompt,
      marketAnalysis: plan.marketAnalysis,
      techStackAnalysis: plan.techStackAnalysis,
      businessAnalysis: plan.businessAnalysis,
      projectScope: plan.projectScope,
      expenditureEstimation: plan.expenditureEstimation,
      competitorAnalysis: plan.competitorAnalysis,
      projectPreview: plan.projectPreview,
      generatedCode: plan.generatedCode,
      createdAt: new Date(plan.createdAt).toISOString(),
    };
  },
});

// Update an MVP plan (for adding generated code)
export const updateMvpPlan = mutation({
  args: {
    planId: v.id("mvpPlans"),
    updates: v.object({
      generatedCode: v.optional(v.array(v.object({
        path: v.string(),
        content: v.string(),
      }))),
      ideaPrompt: v.optional(v.string()),
      marketAnalysis: v.optional(v.object({
        title: v.string(),
        content: v.string(),
      })),
      techStackAnalysis: v.optional(v.object({
        title: v.string(),
        content: v.string(),
      })),
      businessAnalysis: v.optional(v.object({
        title: v.string(),
        content: v.string(),
      })),
      projectScope: v.optional(v.object({
        title: v.string(),
        content: v.string(),
      })),
      expenditureEstimation: v.optional(v.object({
        title: v.string(),
        content: v.string(),
      })),
      competitorAnalysis: v.optional(v.object({
        title: v.string(),
        content: v.string(),
      })),
      projectPreview: v.optional(v.object({
        title: v.string(),
        content: v.string(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new ConvexError("MVP plan not found");
    }

    const updateData: any = { updatedAt: Date.now() };
    
    // Only update fields that are provided
    if (args.updates.generatedCode !== undefined) updateData.generatedCode = args.updates.generatedCode;
    if (args.updates.ideaPrompt !== undefined) updateData.ideaPrompt = args.updates.ideaPrompt;
    if (args.updates.marketAnalysis !== undefined) updateData.marketAnalysis = args.updates.marketAnalysis;
    if (args.updates.techStackAnalysis !== undefined) updateData.techStackAnalysis = args.updates.techStackAnalysis;
    if (args.updates.businessAnalysis !== undefined) updateData.businessAnalysis = args.updates.businessAnalysis;
    if (args.updates.projectScope !== undefined) updateData.projectScope = args.updates.projectScope;
    if (args.updates.expenditureEstimation !== undefined) updateData.expenditureEstimation = args.updates.expenditureEstimation;
    if (args.updates.competitorAnalysis !== undefined) updateData.competitorAnalysis = args.updates.competitorAnalysis;
    if (args.updates.projectPreview !== undefined) updateData.projectPreview = args.updates.projectPreview;

    await ctx.db.patch(args.planId, updateData);

    return { success: true };
  },
});

// Delete an MVP plan
export const deleteMvpPlan = mutation({
  args: { planId: v.id("mvpPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new ConvexError("MVP plan not found");
    }

    await ctx.db.delete(args.planId);

    return { success: true };
  },
});

// Get all MVP plans for admin/superadmin (across all users)
export const getAllMvpPlans = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("mvpPlans")
      .order("desc") // Most recent first
      .collect();

    // Transform to match the frontend MvpPlan interface
    return plans.map(plan => ({
      id: plan._id,
      userId: plan.userId,
      ideaPrompt: plan.ideaPrompt,
      marketAnalysis: plan.marketAnalysis,
      techStackAnalysis: plan.techStackAnalysis,
      businessAnalysis: plan.businessAnalysis,
      projectScope: plan.projectScope,
      expenditureEstimation: plan.expenditureEstimation,
      competitorAnalysis: plan.competitorAnalysis,
      projectPreview: plan.projectPreview,
      generatedCode: plan.generatedCode,
      createdAt: new Date(plan.createdAt).toISOString(),
    }));
  },
});

// Get MVP plan count by user (for analytics)
export const getMvpPlanStats = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("mvpPlans").collect();
    
    const stats = {
      totalPlans: plans.length,
      plansWithCode: plans.filter(p => p.generatedCode && p.generatedCode.length > 0).length,
      plansByUser: {} as Record<string, number>,
    };

    // Count plans by user
    plans.forEach(plan => {
      const userId = plan.userId;
      stats.plansByUser[userId] = (stats.plansByUser[userId] || 0) + 1;
    });

    return stats;
  },
});