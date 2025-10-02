import { internalMutation } from "./_generated/server";

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

// Migration to add API tracking fields to existing users
export const migrateUsersApiTracking = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let updatedCount = 0;
    
    for (const user of users) {
      // Only update users that don't have the new fields
      if (user.apiCalls === undefined || user.apiCallLimit === undefined) {
        await ctx.db.patch(user._id, {
          apiCalls: user.apiCalls ?? 0,
          apiCallLimit: user.apiCallLimit ?? getApiCallLimit(user.subscription),
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }
    
    console.log(`Migration completed: Updated ${updatedCount} users with API tracking fields`);
    return { success: true, updatedUsers: updatedCount };
  },
});