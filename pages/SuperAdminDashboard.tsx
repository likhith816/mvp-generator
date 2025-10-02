
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { User, Role, UserSession, MvpPlan } from '../types';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
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

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Query real data from database
  const usersData = useQuery(api.users.getAllUsers, { limit: 500 });
  const allUsersFromDB = usersData?.users || [];
  
  // Query real sessions from database  
  const sessionsData = useQuery(api.userSessions.getSessionsForAdmin, { limit: 100 });
  const sessions = sessionsData || [];
  
  // Query real system health data
  const healthMetrics = useQuery(api.apiUsageHistory.getSystemHealthMetrics, { hoursBack: 6 });
  const healthData = healthMetrics?.healthData || [];
  
  // Query real subscription data for revenue calculation - current month
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  
  const subscriptionsData = useQuery(api.subscriptions.getSubscriptionAnalytics, {
    startDate: startOfMonth,
    endDate: endOfMonth
  });
  const subscriptionAnalytics = subscriptionsData || null;

  // Query real billing transactions for accurate revenue
  const monthlyRevenueData = useQuery(api.billingTransactions.getMonthlyRevenue, {
    startDate: startOfMonth,
    endDate: endOfMonth
  });
  
  // Mutations for user management and audit logging
  const updateUserMutation = useMutation(api.users.updateUser);
  const logAdminActionMutation = useMutation(api.adminAuditLogs.logAdminAction);
  
  const [userSearch, setUserSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  
  // Query all MVP plans from database
  const allPlans = useQuery(api.mvpPlans.getAllMvpPlans);
  const plans = allPlans || [];

  // Calculate real statistics from database
  const totalUsers = useMemo(() => allUsersFromDB.filter(u => u.role === 'USER').length, [allUsersFromDB]);
  const totalAdmins = useMemo(() => allUsersFromDB.filter(u => u.role === 'ADMIN').length, [allUsersFromDB]);
  
  // Calculate monthly revenue from actual billing transactions
  const monthlyRevenue = useMemo(() => {
    // Prioritize billing transactions data (actual payments) over subscription analytics
    return monthlyRevenueData?.totalRevenue || subscriptionAnalytics?.totalRevenue || 0;
  }, [monthlyRevenueData, subscriptionAnalytics]);
  
  const userMap = useMemo(() => new Map(allUsersFromDB.map(u => [u._id, u.name])), [allUsersFromDB]);

  const filteredUsersByRole = useMemo(() => {
    return roleFilter === 'ALL'
        ? allUsersFromDB
        : allUsersFromDB.filter(user => user.role === roleFilter);
  }, [allUsersFromDB, roleFilter]);

  const filteredSessions = useMemo(() => {
    if (!sessionSearch) return sessions;
    return sessions.filter(s => s.userName.toLowerCase().includes(sessionSearch.toLowerCase()));
  }, [sessionSearch, sessions]);
  
  const filteredPlans = useMemo(() => {
    const searchTerm = planSearch.trim().toLowerCase();
    if (!searchTerm) return plans;
    const searchWords = searchTerm.split(' ').filter(Boolean);

    return plans.filter(p => {
        const userName = (userMap.get(p.userId as any) || '').toLowerCase();
        const idea = p.ideaPrompt.toLowerCase();
        const searchableText = `${userName} ${idea}`;
        return searchWords.every(word => searchableText.includes(word));
    });
  }, [planSearch, plans, userMap]);
  
  const handleRoleChange = async (userId: string, newRole: Role) => {
    const userToUpdate = allUsersFromDB.find(u => u._id === userId);
    if (!userToUpdate || userToUpdate.role === newRole) return;

    let confirmMessage = `Are you sure you want to change ${userToUpdate.name}'s role to ${newRole}?`;

    if (newRole === 'ADMIN' && userToUpdate.role === 'USER') {
      confirmMessage = `Are you sure you want to promote ${userToUpdate.name} to ADMIN?`;
    }

    if (!window.confirm(confirmMessage)) {
        const selectElement = document.getElementById(`role-select-${userId}`) as HTMLSelectElement;
        if (selectElement) {
            selectElement.value = userToUpdate.role;
        }
        return;
    }

    try {
      // Update user role in database
      await updateUserMutation({
        userId: userId as any,
        role: newRole,
      });
      
      // Log admin action
      if (user) {
        await logAdminActionMutation({
          adminId: user.id as any,
          action: "USER_ROLE_CHANGED",
          targetId: userId,
          targetType: "USER",
          details: JSON.stringify({ 
            oldRole: userToUpdate.role, 
            newRole: newRole,
            userName: userToUpdate.name 
          }),
        });
      }
      
      alert(`User ${userToUpdate.name}'s role has been changed to ${newRole}.`);
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role. Please try again.');
      
      // Reset the dropdown on error
      const selectElement = document.getElementById(`role-select-${userId}`) as HTMLSelectElement;
      if (selectElement) {
        selectElement.value = userToUpdate.role;
      }
    }
  };

  const getRoleBadgeClass = (role: Role) => {
    switch(role) {
        case 'USER': return 'bg-gray-700 text-gray-300';
        case 'ADMIN': return 'bg-green-900/50 text-green-300';
        case 'SUPERADMIN': return 'bg-indigo-900/50 text-indigo-300';
        default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold leading-tight text-on-surface">Super Admin Dashboard</h1>
        <p className="mt-2 text-on-surface-variant">System-wide overview and administrative controls.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-lg shadow"><h4 className="text-on-surface-variant">Total Users</h4><p className="text-3xl font-bold text-on-surface">{totalUsers}</p></div>
        <div className="bg-surface p-6 rounded-lg shadow"><h4 className="text-on-surface-variant">Total Admins</h4><p className="text-3xl font-bold text-on-surface">{totalAdmins}</p></div>
        <div className="bg-surface p-6 rounded-lg shadow"><h4 className="text-on-surface-variant">Total Revenue (Month)</h4><p className="text-3xl font-bold text-on-surface">₹{monthlyRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
        <div className="bg-surface p-6 rounded-lg shadow"><h4 className="text-on-surface-variant">System Status</h4><p className="text-3xl font-bold text-green-400">Operational</p></div>
      </div>

      <div className="lg:col-span-2 bg-surface p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-on-surface">User Role Management</h3>
           <div>
              <label htmlFor="role-filter" className="text-sm text-on-surface-variant mr-2">Filter by role:</label>
              <select 
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')}
                className="bg-gray-700 text-on-surface text-xs rounded border border-gray-600 focus:ring-primary focus:border-primary p-2"
              >
                <option value="ALL">All Roles</option>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPERADMIN">Super Admin</option>
              </select>
            </div>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Current Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Change Role</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-gray-700">
              {filteredUsersByRole.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">{user.name}<br/><span className="text-xs text-on-surface-variant">{user.email}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <select 
                        id={`role-select-${user._id}`}
                        title={`Change role for ${user.name}`}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as Role)} 
                        value={user.role} 
                        className="bg-gray-700 text-on-surface text-xs rounded border border-gray-600 focus:ring-primary focus:border-primary p-1"
                     >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPERADMIN">Super Admin</option>
                     </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
           {filteredUsersByRole.length === 0 && <p className="text-center py-4 text-on-surface-variant">No users found for this role.</p>}
        </div>
      </div>
      
      <div className="bg-surface p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-on-surface mb-4">System Health</h3>
        <div className="grid md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold text-on-surface-variant mb-2">Failure Rate (%)</h4>
                <div className="w-full h-64">
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
                <div className="w-full h-64">
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
            <h3 className="text-xl font-semibold text-on-surface">MVP Plans Overview</h3>
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

      <div className="bg-surface p-6 rounded-lg shadow">
         <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-on-surface">User & Admin Session Tracking</h3>
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
              {filteredSessions.map((session: UserSession) => (
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
  );
};

export default SuperAdminDashboard;