
import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuth } from './AuthContext';
import type { MvpPlan } from '../types';

interface MvpPlanContextType {
  plans: MvpPlan[];
  addPlan: (plan: Omit<MvpPlan, 'id' | 'userId' | 'createdAt'>) => Promise<string>;
  getPlanById: (id: string) => MvpPlan | undefined;
  updatePlan: (planId: string, updatedFields: Partial<MvpPlan>) => Promise<void>;
  loading: boolean;
}

// FIX: Export MvpPlanContext to allow it to be imported and used in test files for providing mock values.
export const MvpPlanContext = createContext<MvpPlanContextType | undefined>(undefined);

export const MvpPlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Convex mutations
  const createMvpPlanMutation = useMutation(api.mvpPlans.createMvpPlan);
  const updateMvpPlanMutation = useMutation(api.mvpPlans.updateMvpPlan);
  
  // Query user's MVP plans from database
  const userPlans = useQuery(
    api.mvpPlans.getUserMvpPlans,
    user ? { userId: user.id as any } : "skip"
  );

  const plans = userPlans || [];
  const loading = userPlans === undefined;

  const addPlan = async (plan: Omit<MvpPlan, 'id' | 'userId' | 'createdAt'>): Promise<string> => {
    if (!user) {
      throw new Error('User must be logged in to create MVP plans');
    }

    const planId = await createMvpPlanMutation({
      userId: user.id as any,
      ideaPrompt: plan.ideaPrompt,
      marketAnalysis: plan.marketAnalysis,
      techStackAnalysis: plan.techStackAnalysis,
      businessAnalysis: plan.businessAnalysis,
      projectScope: plan.projectScope,
      expenditureEstimation: plan.expenditureEstimation,
      competitorAnalysis: plan.competitorAnalysis,
      projectPreview: plan.projectPreview,
      generatedCode: plan.generatedCode,
    });

    return planId;
  };

  const getPlanById = (id: string): MvpPlan | undefined => {
    return plans.find(p => p.id === id);
  };
  
  const updatePlan = async (planId: string, updatedFields: Partial<MvpPlan>): Promise<void> => {
    // Only include fields that are actually in the database schema
    const updates: any = {};
    
    if (updatedFields.generatedCode !== undefined) {
      updates.generatedCode = updatedFields.generatedCode;
    }
    if (updatedFields.ideaPrompt !== undefined) {
      updates.ideaPrompt = updatedFields.ideaPrompt;
    }
    if (updatedFields.marketAnalysis !== undefined) {
      updates.marketAnalysis = updatedFields.marketAnalysis;
    }
    if (updatedFields.techStackAnalysis !== undefined) {
      updates.techStackAnalysis = updatedFields.techStackAnalysis;
    }
    if (updatedFields.businessAnalysis !== undefined) {
      updates.businessAnalysis = updatedFields.businessAnalysis;
    }
    if (updatedFields.projectScope !== undefined) {
      updates.projectScope = updatedFields.projectScope;
    }
    if (updatedFields.expenditureEstimation !== undefined) {
      updates.expenditureEstimation = updatedFields.expenditureEstimation;
    }
    if (updatedFields.competitorAnalysis !== undefined) {
      updates.competitorAnalysis = updatedFields.competitorAnalysis;
    }
    if (updatedFields.projectPreview !== undefined) {
      updates.projectPreview = updatedFields.projectPreview;
    }

    await updateMvpPlanMutation({
      planId: planId as any,
      updates,
    });
  };

  return (
    <MvpPlanContext.Provider value={{ plans, addPlan, getPlanById, updatePlan, loading }}>
      {children}
    </MvpPlanContext.Provider>
  );
};

export const useMvpPlan = (): MvpPlanContextType => {
  const context = useContext(MvpPlanContext);
  if (context === undefined) {
    throw new Error('useMvpPlan must be used within an MvpPlanProvider');
  }
  return context;
};
