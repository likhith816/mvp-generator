import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// FIX: Import jest-dom to extend Jest's `expect` with DOM-related matchers like `toBeInTheDocument`, `toBeDisabled`, `toBeEnabled`, and `toHaveTextContent`.
import '@testing-library/jest-dom';
import MvpGeneratorPage from './MvpGeneratorPage';
import { AuthContext } from '../contexts/AuthContext';
import { MvpPlanContext } from '../contexts/MvpPlanContext';
import * as geminiService from '../services/geminiService';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// FIX: Explicitly type the mock function to return a Promise and accept an argument. This resolves the "not assignable to type 'never'" error
// by giving TypeScript the correct signature for mockResolvedValue and mockRejectedValue.
jest.mock('../services/geminiService', () => ({
  generateFullMvpPlan: jest.fn<(_idea: string) => Promise<any>>(),
}));

const mockAddPlan = jest.fn();
const mockUpdateUser = jest.fn();
const mockGenerateFullMvpPlan = geminiService.generateFullMvpPlan as jest.Mock;

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@test.com',
  role: 'USER',
  subscription: 'PRO',
  avatar: '',
  apiCalls: 0,
  apiCallLimit: Infinity,
  status: 'ACTIVE',
};

const renderWithProviders = (user: any = mockUser) => {
  return render(
    // FIX: Corrected the AuthContext provider value to use handleGoogleCredentialResponse, which exists on the context, instead of the non-existent loginWithGoogle.
    <AuthContext.Provider value={{ user, updateUser: mockUpdateUser, login: jest.fn() as any, logout: jest.fn(), signup: jest.fn() as any, handleGoogleCredentialResponse: jest.fn() }}>
      <MvpPlanContext.Provider value={{ plans: [], addPlan: mockAddPlan, getPlanById: jest.fn() as any, updatePlan: jest.fn() }}>
        <MvpGeneratorPage />
      </MvpPlanContext.Provider>
    </AuthContext.Provider>
  );
};

describe('MvpGeneratorPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate.mockClear();
    mockAddPlan.mockClear();
    mockUpdateUser.mockClear();
    mockGenerateFullMvpPlan.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the page and the generate button is initially disabled', () => {
    renderWithProviders();
    expect(screen.getByRole('heading', { name: /generate a new mvp plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate mvp plan/i })).toBeDisabled();
  });

  it('enables the generate button when the user types an idea', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderWithProviders();
    const textarea = screen.getByPlaceholderText(/e\.g\./i);
    await user.type(textarea, 'A great new app idea');
    expect(screen.getByRole('button', { name: /generate mvp plan/i })).toBeEnabled();
  });

  it('shows an API limit error for free users who have reached their limit', () => {
    const freeUserAtLimit = { ...mockUser, subscription: 'FREE', apiCalls: 5, apiCallLimit: 5 };
    renderWithProviders(freeUserAtLimit);
    expect(screen.getByText(/you have reached your limit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate mvp plan/i })).toBeDisabled();
  });

  it('starts generation, shows progress, and navigates on success', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockGenerateFullMvpPlan.mockResolvedValue({ marketAnalysis: { title: 'Test', content: 'Test' } });
    
    renderWithProviders();
    
    const textarea = screen.getByPlaceholderText(/e\.g\./i);
    await user.type(textarea, 'A brilliant idea');
    
    const generateButton = screen.getByRole('button', { name: /generate mvp plan/i });
    await user.click(generateButton);

    expect(screen.getByText(/generating plan\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText('Market Analysis')).toBeInTheDocument();
    
    // Fast-forward timers to simulate the animation and API call
    jest.runAllTimers();

    await waitFor(() => expect(mockGenerateFullMvpPlan).toHaveBeenCalledWith('A brilliant idea'));
    await waitFor(() => expect(mockAddPlan).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/view-plan/')));
  });

  it('increments API calls for a free user after successful generation', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const freeUser = { ...mockUser, subscription: 'FREE', apiCalls: 2, apiCallLimit: 5 };
    mockGenerateFullMvpPlan.mockResolvedValue({ marketAnalysis: { title: 'Test', content: 'Test' } });
    
    renderWithProviders(freeUser);
    
    await user.type(screen.getByPlaceholderText(/e\.g\./i), 'Another idea');
    await user.click(screen.getByRole('button', { name: /generate mvp plan/i }));

    jest.runAllTimers();

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith({ apiCalls: 3 }));
  });
  
  it('shows an error message if generation fails', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const errorMessage = "AI service failed";
    mockGenerateFullMvpPlan.mockRejectedValue(new Error(errorMessage));
    
    renderWithProviders();
    
    await user.type(screen.getByPlaceholderText(/e\.g\./i), 'A failed idea');
    await user.click(screen.getByRole('button', { name: /generate mvp plan/i }));
    
    jest.runAllTimers();

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(errorMessage));
    expect(screen.getByRole('button', { name: /generate mvp plan/i })).toBeEnabled();
  });
});
