import { mutation } from "./_generated/server";

// Clean up old userSessions table to resolve schema conflicts
export const clearUserSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const allSessions = await ctx.db.query("userSessions").collect();
    
    for (const session of allSessions) {
      await ctx.db.delete(session._id);
    }
    
    return {
      deletedCount: allSessions.length,
      message: `Deleted ${allSessions.length} old session records`,
    };
  },
});