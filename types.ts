export type Role = 'USER' | 'ADMIN' | 'SUPERADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string; // Optional for Google OAuth users
  hasPassword?: boolean; // Indicates if user has password-based auth
  role: Role;
  subscription: SubscriptionPlan;
  avatar: string;
  apiCalls: number;
  apiCallLimit: number;
  status: UserStatus;
}

export interface MvpPlanSection {
    title: string;
    content: string;
}

export interface ProjectFile {
    path: string;
    content: string;
}

export interface MvpPlan {
  id: string;
  userId: string;
  ideaPrompt: string;
  marketAnalysis: MvpPlanSection;
  techStackAnalysis: MvpPlanSection;
  businessAnalysis: MvpPlanSection;
  projectScope: MvpPlanSection;
  expenditureEstimation: MvpPlanSection;
  competitorAnalysis: MvpPlanSection;
  projectPreview: MvpPlanSection;
  createdAt: string;
  generatedCode?: ProjectFile[];
}

export interface UserSession {
  id: string;
  userName: string;
  loginTime: string;
  actions: number;
}

export interface AccessRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedRole: 'ADMIN' | 'SUPERADMIN';
  status: 'PENDING';
  createdAt: string;
}

export interface ApiUsageRecord {
  date: string;
  calls: number;
}
