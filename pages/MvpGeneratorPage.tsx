
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMvpPlan } from '../contexts/MvpPlanContext';
import { generateFullMvpPlan } from '../services/geminiService';
import type { MvpPlan } from '../types';
import { MVP_GENERATION_STEPS } from '../constants';
import Alert from '../components/common/Alert';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const MvpGeneratorPage: React.FC = () => {
    const [idea, setIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [error, setError] = useState<string | null>(null);
    const { user, updateUser } = useAuth();
    const { addPlan } = useMvpPlan();
    const navigate = useNavigate();
    // The type `NodeJS.Timeout` is specific to Node.js environments and is not available in the browser, where `setInterval` returns a `number`.
    // Using `ReturnType<typeof setInterval>` makes the code portable and correctly typed for any JavaScript environment (browser or Node).
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Add API usage logging mutation
    const logApiCall = useMutation(api.apiUsageHistory.logApiCall);

    const canGenerate = user && (user.subscription !== 'FREE' || user.apiCalls < user.apiCallLimit);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea || !user || !canGenerate) return;

        setIsLoading(true);
        setCurrentStep(0);
        setError(null);

        const stepDuration = 1500;
        intervalRef.current = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= MVP_GENERATION_STEPS.length - 1) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return prev;
                }
                return prev + 1;
            });
        }, stepDuration);

        try {
            const totalAnimationTime = (MVP_GENERATION_STEPS.length) * stepDuration;
            const generationPromise = generateFullMvpPlan(idea);
            const timerPromise = new Promise(resolve => setTimeout(resolve, totalAnimationTime));
            
            const [generatedSections] = await Promise.all([generationPromise, timerPromise]);
            
            if (intervalRef.current) clearInterval(intervalRef.current);
            setCurrentStep(MVP_GENERATION_STEPS.length);

            const newPlan = {
                ideaPrompt: idea,
                ...generatedSections,
            };

            // Save plan to database and get the ID
            const planId = await addPlan(newPlan);
            
            // Increment API calls for all users and log to usage history
            updateUser({ apiCalls: (user.apiCalls || 0) + 1 });
            
            // Log API call to usage history for analytics
            await logApiCall({ userId: user.id as any });
            
            setTimeout(() => navigate(`/view-plan/${planId}`), 500);

        } catch (err: any) {
            console.error("Failed to generate MVP plan:", err);
            setError(err.message || "An error occurred during generation. Please try again.");
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsLoading(false);
            setCurrentStep(-1);
        }
    }, [idea, user, canGenerate, addPlan, navigate, updateUser]);
    
    const renderWorkflowSteps = () => (
        <div className="mt-8 text-left max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-center mb-6">
                {isLoading ? "Generation Progress" : "Our AI Generation Workflow"}
            </h2>
            <ol className="space-y-4">
                {MVP_GENERATION_STEPS.map((step, index) => {
                    const isCompleted = currentStep > index || currentStep === MVP_GENERATION_STEPS.length;
                    const isInProgress = currentStep === index && isLoading;
                    
                    let statusIcon;
                    if (isCompleted) {
                        statusIcon = (
                            <span className="flex items-center justify-center w-8 h-8 bg-secondary rounded-full">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </span>
                        );
                    } else if (isInProgress) {
                        statusIcon = (
                            <span className="flex items-center justify-center w-8 h-8 bg-primary rounded-full ring-4 ring-primary/30">
                                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                        );
                    } else {
                        statusIcon = (
                           <span className="flex items-center justify-center w-8 h-8 bg-surface border-2 border-gray-600 rounded-full">
                                <span className="text-sm font-bold text-on-surface-variant">{index + 1}</span>
                           </span>
                        );
                    }

                    return (
                        <li key={step} className="flex items-center space-x-4 p-3 bg-surface/50 rounded-lg">
                            {statusIcon}
                            <span className={`font-medium ${isCompleted ? 'text-on-surface' : isInProgress ? 'text-primary' : 'text-on-surface-variant'}`}>
                                {step}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Generate a New MVP Plan</h1>
            <p className="text-on-surface-variant mb-8">Describe your idea, and our AI will create a detailed plan for you.</p>

            <div className="bg-surface p-8 rounded-lg shadow-lg">
                {error && <div className="mb-4"><Alert type="error" title="Generation Failed" message={error} onClose={() => setError(null)} /></div>}
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        className="w-full h-40 p-4 border border-gray-600 bg-gray-700 text-on-surface rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition placeholder-gray-400"
                        placeholder="e.g., A mobile app that uses AI to create personalized workout plans based on user's fitness level and available equipment."
                        disabled={isLoading}
                    />
                    {!canGenerate && user?.subscription === 'FREE' && (
                        <p className="text-red-500 mt-2">You have reached your limit of {user.apiCallLimit} generations for the free plan.</p>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading || !idea || !canGenerate}
                        className="mt-6 w-full md:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                               Generating Plan...
                            </>
                        ) : 'Generate MVP Plan'}
                    </button>
                </form>

                {renderWorkflowSteps()}
            </div>
        </div>
    );
};

export default MvpGeneratorPage;