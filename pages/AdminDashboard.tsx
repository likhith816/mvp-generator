
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { MOCK_ADMINS } from '../constants';
import type { User, UserSession, UserStatus, MvpPlan } from '../types';
import { useAuth } from '../contexts/AuthContext';

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const Highlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  const searchWords = highlight.trim().toLowerCase().split(' ').filter(Boolean);
  if (searchWords.length === 0 || !text) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${searchWords.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.filter(Boolean).map((part, i) => {
        if (searchWords.includes(part.toLowerCase())) {
          return (
            <mark key={i} className="bg-primary/30 text-on-surface rounded px-1">
              {part}
            </mark>
          );
        }
        return part;
      })}
    </span>
  );
};


const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Query real users from database
  const usersData = useQuery(api.users.getAllUsers, { limit: 100 });
  const allUsers = usersData?.users || [];
  const users = allUsers.filter(u => u.role === 'USER');
  
  // Query real sessions from database
  const sessionsData = useQuery(api.userSessions.getSessionsForAdmin, { limit: 50 });
  const sessions = sessionsData || [];
  
  // Query real system health data
  const healthMetrics = useQuery(api.apiUsageHistory.getSystemHealthMetrics, { hoursBack: 6 });
  const healthData = healthMetrics?.healthData || [];
  
  // Mutations for user management
  const updateUserMutation = useMutation(api.users.updateUser);
  const deleteUserMutation = useMutation(api.users.deleteUser);
  const logAdminActionMutation = useMutation(api.adminAuditLogs.logAdminAction);
  
  const [userSearch, setUserSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  
  // Query all MVP plans from database
  const allPlans = useQuery(api.mvpPlans.getAllMvpPlans);
  const plans = allPlans || [];
  
  const userMap = useMemo(() => new Map(allUsers.map(u => [u._id, u.name])), [allUsers]);

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    return users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));
  }, [userSearch, users]);

  const filteredSessions = useMemo(() => {
    if (!sessionSearch) return sessions;
    return sessions.filter(s => s.userName.toLowerCase().includes(sessionSearch.toLowerCase()));
  }, [sessionSearch, sessions]);  const filteredPlans = useMemo(() => {
    const searchTerm = planSearch.trim().toLowerCase();
    if (!searchTerm) return plans;
    const searchWords = searchTerm.split(' ').filter(Boolean);

    return plans.filter(p => {
        const userName = (userMap.get(p.userId) || '').toLowerCase();
        const idea = p.ideaPrompt.toLowerCase();
        const searchableText = `${userName} ${idea}`;
        return searchWords.every(word => searchableText.includes(word));
    });
  }, [planSearch, plans, userMap]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      await updateUserMutation({
        userId: userId as any, // Cast to Id<"users">
        status: status,
      });
      
      // Log admin action
      if (user) {
        await logAdminActionMutation({
          adminId: user.id as any,
          action: "USER_STATUS_CHANGED",
          targetId: userId,
          targetType: "USER",
          details: JSON.stringify({ newStatus: status }),
        });
      }
      
      console.log(`User status changed to ${status}`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUserMutation({
          userId: userId as any, // Cast to Id<"users">
        });
        
        // Log admin action
        if (user) {
          await logAdminActionMutation({
            adminId: user.id as any,
            action: "USER_DELETED",
            targetId: userId,
            targetType: "USER",
            details: JSON.stringify({ deletedAt: new Date().toISOString() }),
          });
        }
        
        console.log('User deleted successfully');
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  };

  const usageBySub = useMemo(() => {
      const counts = users.reduce((acc, user) => {
          acc[user.subscription] = (acc[user.subscription] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);
  
  const COLORS: { [key: string]: string } = { FREE: '#7c3aed', PRO: '#059669', ENTERPRISE: '#db2777' };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold leading-tight text-on-surface">Admin Dashboard</h1>
        <p className="mt-2 text-on-surface-variant">Manage users and monitor system activity.</p>
      </header>

      <div className="bg-surface p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-on-surface">User Management</h3>
            <input 
              type="search"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="px-3 py-1 border border-gray-600 bg-gray-700 text-on-surface rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Subscription</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-gray-700">
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">{u.name}<br/><span className="text-xs text-on-surface-variant">{u.email}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{u.subscription}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'}`}>
                            {u.status || 'ACTIVE'}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      {(u.status || 'ACTIVE') === 'ACTIVE' ? (
                          <button onClick={() => handleStatusChange(u._id, 'INACTIVE')} className="text-yellow-500 hover:text-yellow-700">Deactivate</button>
                      ) : (
                          <button onClick={() => handleStatusChange(u._id, 'ACTIVE')} className="text-green-500 hover:text-green-700">Activate</button>
                      )}
                      <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
             {filteredUsers.length === 0 && <p className="text-center py-4 text-on-surface-variant">No users found.</p>}
          </div>
        </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-lg shadow">
           <h3 className="text-xl font-semibold text-on-surface mb-4">Users by Subscription</h3>
           <div style={{ width: '100%', height: 300 }}>
             <ResponsiveContainer>
              <PieChart>
                <Pie data={usageBySub} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {usageBySub.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4a5568' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow">
           <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-on-surface">User Sessions</h3>
            <input 
              type="search"
              placeholder="Search sessions..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="px-3 py-1 border border-gray-600 bg-gray-700 text-on-surface rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
           <div className="overflow-y-auto max-h-80">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Login Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-gray-700">
                {filteredSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">{session.userName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{session.loginTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{session.actions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
             {filteredSessions.length === 0 && <p className="text-center py-4 text-on-surface-variant">No sessions found.</p>}
          </div>
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-on-surface mb-4">System Health</h3>
        <div className="grid md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold text-on-surface-variant mb-2">Failure Rate (%)</h4>
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <LineChart data={healthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="time" tick={{ fill: '#9ca3af' }} fontSize={12} />
                            <YAxis tick={{ fill: '#9ca3af' }} fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4a5568' }} />
                            <Line type="monotone" dataKey="failureRate" name="Fail Rate" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-on-surface-variant mb-2">API Call Success Rate (%)</h4>
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <LineChart data={healthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="time" tick={{ fill: '#9ca3af' }} fontSize={12} />
                            <YAxis domain={[90, 100]} tick={{ fill: '#9ca3af' }} fontSize={12}/>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4a5568' }} />
                            <Line type="monotone" dataKey="successRate" name="Success Rate" stroke="#22c55e" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-on-surface">Global Chat History</h3>
            <input
                type="search"
                placeholder="Search plans by user or prompt..."
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                className="px-3 py-1 border border-gray-600 bg-gray-700 text-on-surface rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
        </div>
        <div className="overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900 sticky top-0">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Idea Prompt</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created At</th>
                    </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-gray-700">
                    {filteredPlans.map((plan: MvpPlan) => (
                        <tr key={plan.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">
                                <Highlight text={userMap.get(plan.userId as any) || 'Unknown User'} highlight={planSearch} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant max-w-sm truncate">
                                <Link to={`/view-plan/${plan.id}`} className="hover:text-primary hover:underline">
                                    <Highlight text={plan.ideaPrompt} highlight={planSearch} />
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">{new Date(plan.createdAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredPlans.length === 0 && <p className="text-center py-4 text-on-surface-variant">No plans found.</p>}
        </div>
     </div>
    </div>
  );
};

export default AdminDashboard;
