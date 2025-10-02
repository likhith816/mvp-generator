import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Helper function to get date N days ago in YYYY-MM-DD format
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Populate test API usage history data for existing users
export const populateTestApiUsageHistory = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting to populate test API usage history...");
    
    // Get all existing users
    const users = await ctx.db.query("users").collect();
    console.log(`Found ${users.length} users to create history for`);
    
    const now = Date.now();
    let totalRecordsCreated = 0;
    
    for (const user of users) {
      console.log(`Creating history for user: ${user.email}`);
      
      // Create usage history for the last 14 days
      for (let daysAgo = 0; daysAgo < 14; daysAgo++) {
        const date = getDateDaysAgo(daysAgo);
        
        // Check if record already exists
        const existingRecord = await ctx.db
          .query("apiUsageHistory")
          .withIndex("by_user_date", (q) => 
            q.eq("userId", user._id).eq("date", date)
          )
          .first();
        
        if (!existingRecord) {
          // Generate random API calls (0-5 for regular days, 0-2 for recent days)
          const maxCalls = daysAgo < 3 ? 2 : 5;
          const calls = Math.floor(Math.random() * (maxCalls + 1));
          
          if (calls > 0) { // Only create records for days with usage
            await ctx.db.insert("apiUsageHistory", {
              userId: user._id,
              date,
              calls,
              createdAt: now - (daysAgo * 24 * 60 * 60 * 1000), // Spread creation times
              updatedAt: now - (daysAgo * 24 * 60 * 60 * 1000),
            });
            totalRecordsCreated++;
            console.log(`  Added ${calls} API calls for ${date}`);
          }
        } else {
          console.log(`  Record already exists for ${date}`);
        }
      }
    }
    
    console.log(`Completed! Created ${totalRecordsCreated} API usage history records`);
    return { 
      success: true, 
      usersProcessed: users.length, 
      recordsCreated: totalRecordsCreated 
    };
  },
});

// Clean up and reset API usage history (for testing)
export const resetApiUsageHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("apiUsageHistory").collect();
    
    for (const record of allRecords) {
      await ctx.db.delete(record._id);
    }
    
    return { deletedRecords: allRecords.length };
  },
});

// Get API usage statistics across all users
export const getApiUsageStatistics = mutation({
  args: {},
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("apiUsageHistory").collect();
    const totalCalls = allRecords.reduce((sum, record) => sum + record.calls, 0);
    
    // Group by date
    const dailyStats = allRecords.reduce((acc, record) => {
      acc[record.date] = (acc[record.date] || 0) + record.calls;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by user
    const userStats = allRecords.reduce((acc, record) => {
      const userId = record.userId;
      acc[userId] = (acc[userId] || 0) + record.calls;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalRecords: allRecords.length,
      totalApiCalls: totalCalls,
      uniqueDates: Object.keys(dailyStats).length,
      uniqueUsers: Object.keys(userStats).length,
      dailyStats,
      topUsers: Object.entries(userStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([userId, calls]) => ({ userId, calls }))
    };
  },
});