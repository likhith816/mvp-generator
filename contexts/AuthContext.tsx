import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { User, Role } from '../types';

interface AuthResult {
  success: boolean;
  message?: string;
}

// Helper to decode JWTs from Google Sign-In
function decodeJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error("Error decoding JWT", e);
    return null;
  }
}

// Generate a simple session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  updateUser: (updatedUser: Partial<User>) => Promise<AuthResult>;
  updateSubscription: (subscription: 'FREE' | 'PRO' | 'ENTERPRISE') => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  handleGoogleCredentialResponse: (response: any) => Promise<void>;
  loading: boolean;
}

// FIX: Export AuthContext to be used in other files, resolving the import error in hooks/useAuth.ts.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem('sessionToken')
  );

  // Convex mutations and queries
  const createUserMutation = useMutation(api.users.createUser);
  const loginUser = useMutation(api.auth.loginUser);
  const getUserForPasswordChange = useMutation(api.auth.getUserForPasswordChange);
  const checkUserExists = useMutation(api.auth.checkUserExists);
  const updateUserMutation = useMutation(api.users.updateUser);
  const updateUserPassword = useMutation(api.users.updateUserPassword);
  const updateUserSubscription = useMutation(api.users.updateUserSubscription);
  const upgradeSubscriptionMutation = useMutation(api.subscriptions.upgradeSubscription);
  const incrementApiCalls = useMutation(api.users.incrementApiCalls);
  const createSession = useMutation(api.sessions.createSession);
  const invalidateSession = useMutation(api.sessions.invalidateSession);
  const invalidateExpiredSession = useMutation(api.sessions.invalidateExpiredSession);
  
  // Query to get current user by session token
  const sessionData = useQuery(
    api.sessions.getUserBySessionToken,
    sessionToken ? { token: sessionToken } : "skip"
  );

  // Effect to handle session data
  useEffect(() => {
    if (sessionData === undefined) {
      // Still loading
      return;
    }

    if (sessionData === null) {
      // No valid session
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
      setLoading(false);
      return;
    }

    if ('expired' in sessionData) {
      // Session expired, clean it up
      if (sessionToken) {
        invalidateExpiredSession({ token: sessionToken });
      }
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
      setLoading(false);
      return;
    }

    // Valid session, set user
    const userData = sessionData.user;
    setUser({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role as 'USER' | 'ADMIN' | 'SUPERADMIN',
      subscription: userData.subscription as 'FREE' | 'PRO' | 'ENTERPRISE',
      hasPassword: userData.hasPassword,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=4f46e5&color=fff`,
      apiCalls: userData.apiCalls || 0,
      apiCallLimit: userData.apiCallLimit || 5,
      status: 'ACTIVE' as const,
    });
    setLoading(false);
  }, [sessionData, sessionToken, invalidateExpiredSession]);

  const login = async (email: string, password?: string): Promise<AuthResult> => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!email || !password) {
        return { success: false, message: 'Email and password are required.' };
      }

      // Get user by email and validate password
      const dbUser = await loginUser({ email, password });

      // Create session
      const token = generateSessionToken();
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

      await createSession({
        userId: dbUser._id,
        token,
        expiresAt,
      });

      // Store session token
      setSessionToken(token);
      localStorage.setItem('sessionToken', token);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (sessionToken) {
        await invalidateSession({ token: sessionToken });
        localStorage.removeItem('sessionToken');
      }
      setUser(null);
      setSessionToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, clear local state
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
    }
  };
  
  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!name || !email || !password) {
        return { success: false, message: 'Name, email, and password are required.' };
      }

      // Create new user
      const userId = await createUserMutation({
        name,
        email,
        password,
        role: 'USER' as const,
        subscription: 'FREE' as const,
      });

      // Create session
      const token = generateSessionToken();
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

      await createSession({
        userId,
        token,
        expiresAt,
      });

      // Store session token
      setSessionToken(token);
      localStorage.setItem('sessionToken', token);

      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error messages
      if (error.message?.includes('already exists')) {
        return { success: false, message: 'An account with this email already exists.' };
      }
      
      return { success: false, message: error.message || 'Signup failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any): Promise<void> => {
    try {
      const credential = response.credential;
      if (!credential) {
        console.error("Google credential response is missing.");
        return;
      }
      
      const payload = decodeJwt(credential);
      if (!payload) {
          return;
      }
      
      const { name, email, picture } = payload;
      
      // Check if user exists
      const existingUser = await checkUserExists({ email });
      
      if (existingUser) {
          // If user exists but has a password, they should use password login
          if (existingUser.password) {
            console.error("This account was created with password. Please sign in with your password.");
            return;
          }
          
          // Create session for existing Google OAuth user
          const token = generateSessionToken();
          const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

          await createSession({
            userId: existingUser._id,
            token,
            expiresAt,
          });

          setSessionToken(token);
          localStorage.setItem('sessionToken', token);
      } else {
          // Create new Google OAuth user (no password)
          const userId = await createUserMutation({
            name,
            email,
            // No password for Google OAuth users
            role: 'USER' as const,
            subscription: 'FREE' as const,
          });

          // Create session
          const token = generateSessionToken();
          const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

          await createSession({
            userId,
            token,
            expiresAt,
          });

          setSessionToken(token);
          localStorage.setItem('sessionToken', token);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };
  
  const updateUser = async (updatedUserInfo: Partial<User>): Promise<AuthResult> => {
    try {
      if (!user) {
        return { success: false, message: 'You must be logged in to update profile.' };
      }

      // Handle API call increment separately
      if (updatedUserInfo.apiCalls !== undefined && updatedUserInfo.apiCalls > (user.apiCalls || 0)) {
        // This is an API call increment
        const result = await incrementApiCalls({ userId: user.id as any });
        
        // Update local user state with the new API call count
        setUser(prevUser => ({
          ...prevUser!,
          apiCalls: result.apiCalls,
          apiCallLimit: result.apiCallLimit,
        }));
        
        return { success: true };
      }

      // Validate required fields for profile updates
      if (updatedUserInfo.name !== undefined && !updatedUserInfo.name.trim()) {
        return { success: false, message: 'Name cannot be empty.' };
      }
      
      if (updatedUserInfo.email !== undefined && !updatedUserInfo.email.trim()) {
        return { success: false, message: 'Email cannot be empty.' };
      }

      // Update user in database (excluding apiCalls as it's handled above)
      const updateData = { ...updatedUserInfo };
      delete updateData.apiCalls;
      delete updateData.apiCallLimit; // These should not be updated directly

      await updateUserMutation({
        userId: user.id as any, // Convert string to Id type
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        avatar: updateData.avatar,
      });

      // Update local user state immediately for better UX
      const updatedUser = { ...user, ...updateData };
      setUser(updatedUser);

      return { success: true, message: 'Profile updated successfully!' };
    } catch (error: any) {
      console.error('Update user error:', error);
      
      // Handle specific error messages
      if (error.message?.includes('already taken')) {
        return { success: false, message: 'This email is already taken by another user.' };
      }
      
      return { success: false, message: error.message || 'Failed to update profile. Please try again.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      // Check if user is logged in
      if (!user) {
        return { success: false, message: 'You must be logged in to change your password.' };
      }

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return { success: false, message: 'Current password and new password are required.' };
      }

      // Get current user data from database
      const dbUser = await getUserForPasswordChange({ email: user.email });
      if (!dbUser) {
        return { success: false, message: 'User not found.' };
      }

      // Check if user account was created with Google OAuth
      if (!dbUser.password) {
        return { success: false, message: 'This account was created with Google. Password cannot be changed.' };
      }

      // Verify current password
      if (dbUser.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect.' };
      }

      // Validate new password
      if (newPassword.length < 6) {
        return { success: false, message: 'New password must be at least 6 characters long.' };
      }

      if (newPassword === currentPassword) {
        return { success: false, message: 'New password must be different from current password.' };
      }

      // Update password in database
      await updateUserPassword({
        userId: dbUser._id,
        newPassword,
      });

      return { success: true, message: 'Password changed successfully.' };
    } catch (error: any) {
      console.error('Change password error:', error);
      return { success: false, message: error.message || 'Failed to change password. Please try again.' };
    }
  };

  const updateSubscription = async (subscription: 'FREE' | 'PRO' | 'ENTERPRISE'): Promise<AuthResult> => {
    try {
      // Check if user is logged in
      if (!user) {
        return { success: false, message: 'You must be logged in to update subscription.' };
      }

      // Prevent downgrading
      const planOrder = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
      const currentOrder = planOrder[user.subscription];
      const newOrder = planOrder[subscription];
      
      if (newOrder <= currentOrder) {
        return { success: false, message: 'Downgrading subscriptions is not allowed.' };
      }

      if (subscription === 'FREE') {
        // For FREE plan, just update the user subscription without billing
        await updateUserSubscription({
          userId: user.id as any,
          subscription,
        });
      } else {
        // For PRO/ENTERPRISE plans, use the upgrade function that records billing transactions
        const upgradeResult = await upgradeSubscriptionMutation({
          userId: user.id as any,
          newPlanType: subscription,
          paymentMethodType: "card", // Default payment method
        });
        
        if (!upgradeResult.subscriptionId) {
          throw new Error('Failed to create subscription record');
        }
      }

      // Update local user state
      const apiCallLimit = subscription === 'PRO' ? 40 : subscription === 'ENTERPRISE' ? 999999 : 5;
      setUser({
        ...user,
        subscription,
        apiCallLimit,
      });

      return { success: true, message: `Successfully upgraded to ${subscription} plan!` };
    } catch (error: any) {
      console.error('Update subscription error:', error);
      return { success: false, message: error.message || 'Failed to update subscription. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      signup, 
      updateUser,
      updateSubscription,
      changePassword, 
      handleGoogleCredentialResponse,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};