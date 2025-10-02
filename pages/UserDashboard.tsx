
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMvpPlan } from '../contexts/MvpPlanContext';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { plans, loading } = useMvpPlan();

  // Query real API usage history from database
  const apiUsageHistory = useQuery(
    api.apiUsageHistory.getApiUsageHistory,
    user ? { userId: user.id as any } : "skip"
  );

  if (!user) return null;

  // Plans are already filtered by user in the context
  const userPlans = plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const usagePercentage = user.subscription === 'FREE' ? (user.apiCalls / user.apiCallLimit) * 100 : 0;

  // Show loading state while fetching usage history
  const historyData = apiUsageHistory || [];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="md:w-1/3 lg:w-1/4 bg-surface p-6 rounded-lg shadow-lg flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-on-surface">Chat History</h2>
          <Link to="/generate-mvp" className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors text-sm">
            + New Plan
          </Link>
        </div>
        <div className="flex-grow overflow-y-auto -mr-3 pr-3 space-y-2">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-on-surface-variant mt-2">Loading chat history...</p>
            </div>
          ) : userPlans.length > 0 ? userPlans.map(plan => (
            <Link 
              key={plan.id}
              to={`/view-plan/${plan.id}`}
              className="block p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <h3 className="text-sm font-semibold text-on-surface truncate">{plan.ideaPrompt}</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {new Date(plan.createdAt).toLocaleString()}
              </p>
            </Link>
          )) : (
            <div className="text-center py-10">
              <p className="text-on-surface-variant text-sm">No plans generated yet.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-8">
        <header>
          <h1 className="text-3xl font-bold leading-tight text-on-surface">Welcome, {user.name}!</h1>
          <p className="mt-2 text-on-surface-variant">Here's your workspace. Let's build something amazing.</p>
        </header>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-surface p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-on-surface">Subscription</h3>
            <p className="text-2xl font-bold text-primary mt-2 capitalize">{user.subscription}</p>
            <Link to="/profile" className="text-sm text-primary hover:underline mt-4 inline-block">Manage</Link>
          </div>
          <div className="md:col-span-2 bg-surface p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-on-surface">API Usage</h3>
            {user.subscription === 'FREE' ? (
              <>
                <p className="mt-2 text-on-surface-variant">{user.apiCalls} / {user.apiCallLimit} generations used</p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <p className="mt-2 text-on-surface-variant">You have unlimited generations with your Pro plan.</p>
            )}
          </div>
        </div>

        <div className="bg-surface p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-on-surface mb-4">API Usage History (Last 7 Days)</h3>
            <div className="w-full h-64">
                <ResponsiveContainer>
                    <LineChart data={historyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} fontSize={12} />
                        <YAxis tick={{ fill: '#9ca3af' }} fontSize={12} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                        <Line type="monotone" dataKey="calls" name="API Calls" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-surface p-6 rounded-lg shadow text-center">
            <h2 className="text-2xl font-bold text-on-surface">Ready to start your next project?</h2>
            <p className="text-on-surface-variant mt-2 mb-4">Turn your next big idea into a actionable plan.</p>
            <Link to="/generate-mvp" className="bg-secondary text-white font-semibold py-3 px-6 rounded-lg hover:bg-secondary/90 transition-colors">
              Generate a New MVP Plan
            </Link>
        </div>
        
      </main>
    </div>
  );
};

export default UserDashboard;
