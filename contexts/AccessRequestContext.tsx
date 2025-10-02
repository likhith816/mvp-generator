import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { AccessRequest } from '../types';
import { MOCK_ACCESS_REQUESTS, MOCK_USERS, MOCK_ADMINS, MOCK_SUPERADMINS } from '../constants';

interface AccessRequestContextType {
  requests: AccessRequest[];
  addRequest: (requestData: Omit<AccessRequest, 'id' | 'status' | 'createdAt'>) => void;
  processRequest: (requestId: string, decision: 'approve' | 'deny') => boolean; // Return true on success
}

export const AccessRequestContext = createContext<AccessRequestContextType | undefined>(undefined);

export const AccessRequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<AccessRequest[]>(MOCK_ACCESS_REQUESTS);

  const addRequest = (requestData: Omit<AccessRequest, 'id' | 'status' | 'createdAt'>) => {
    const newRequest: AccessRequest = {
      ...requestData,
      id: `req-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    // To ensure consistency with how other mock data is handled (e.g., user creation, request processing),
    // this new request is added directly to the mock array. This makes the state change persistent
    // for the duration of the application's session, even if components are unmounted and remounted.
    MOCK_ACCESS_REQUESTS.push(newRequest);
    setRequests(prevRequests => [...prevRequests, newRequest]);
  };

  const processRequest = (requestId: string, decision: 'approve' | 'deny'): boolean => {
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      return false;
    }

    if (decision === 'approve') {
      if (request.requestedRole === 'ADMIN') {
        const userIndex = MOCK_USERS.findIndex(u => u.id === request.userId);
        if (userIndex > -1) {
            const [userToPromote] = MOCK_USERS.splice(userIndex, 1);
            userToPromote.role = 'ADMIN';
            MOCK_ADMINS.push(userToPromote);
            alert(`User ${request.userName} has been promoted to Admin.`);
        }
      } else if (request.requestedRole === 'SUPERADMIN') {
        const adminIndex = MOCK_ADMINS.findIndex(u => u.id === request.userId);
        if (adminIndex > -1) {
            const [adminToPromote] = MOCK_ADMINS.splice(adminIndex, 1);
            adminToPromote.role = 'SUPERADMIN';
            MOCK_SUPERADMINS.push(adminToPromote);
            alert(`Admin ${request.userName} has been promoted to Superadmin.`);
        }
      }
    } else {
        alert(`Request for ${request.userName} has been denied.`);
    }

    // Update state purely
    setRequests(prevRequests => prevRequests.filter(r => r.id !== requestId));
    
    // Also update the mock array to handle page reloads more gracefully in a demo environment.
    const mockIndex = MOCK_ACCESS_REQUESTS.findIndex(r => r.id === requestId);
    if (mockIndex > -1) {
      MOCK_ACCESS_REQUESTS.splice(mockIndex, 1);
    }

    return true;
  };


  return (
    <AccessRequestContext.Provider value={{ requests, addRequest, processRequest }}>
      {children}
    </AccessRequestContext.Provider>
  );
};

export const useAccessRequest = (): AccessRequestContextType => {
  const context = useContext(AccessRequestContext);
  if (context === undefined) {
    throw new Error('useAccessRequest must be used within an AccessRequestProvider');
  }
  return context;
};