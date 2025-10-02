import { internalMutation } from "./_generated/server";

// Helper function to get date N days ago in YYYY-MM-DD format
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Create sample API usage history for testing
export const createSampleApiUsageHistory = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const users = await ctx.db.query("users").collect();
    
    if (users.length === 0) {
      console.log("No users found to create sample data for");
      return { success: false, message: "No users found" };
    }
    
    const now = Date.now();
    let recordsCreated = 0;
    
    for (const user of users) {
      // Create usage history for the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = getDateDaysAgo(i);
        
        // Check if record already exists
        const existingRecord = await ctx.db
          .query("apiUsageHistory")
          .withIndex("by_user_date", (q) => 
            q.eq("userId", user._id).eq("date", date)
          )
          .first();
        
        if (!existingRecord) {
          // Generate realistic sample data based on subscription
          let calls = 0;
          if (user.subscription === 'FREE') {
            calls = Math.floor(Math.random() * 3); // 0-2 calls per day for free users
          } else if (user.subscription === 'PRO') {
            calls = Math.floor(Math.random() * 8); // 0-7 calls per day for pro users
          } else if (user.subscription === 'ENTERPRISE') {
            calls = Math.floor(Math.random() * 15); // 0-14 calls per day for enterprise users
          }
          
          // Don't create records for days with 0 calls (more realistic)
          if (calls > 0) {
            await ctx.db.insert("apiUsageHistory", {
              userId: user._id,
              date,
              calls,
              createdAt: now,
              updatedAt: now,
            });
            recordsCreated++;
          }
        }
      }
    }
    
    console.log(`Created ${recordsCreated} sample API usage history records`);
    return { success: true, recordsCreated };
  },
});